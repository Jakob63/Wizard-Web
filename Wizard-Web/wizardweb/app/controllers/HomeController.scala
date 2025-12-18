package controllers

import components.WebConfiguration

import javax.inject.*
import play.api.*
import play.api.libs.json.{Json, JsValue, Reads, JsPath, JsError, JsArray, JsNull}
import play.api.mvc.*
import wizard.controller.{GameState, aGameLogic}
import wizard.model.player.Player
import wizard.controller.controllerBaseImpl.BaseGameLogic
import wizard.model.rounds.Game
import _root_.util.UserInput
import play.api.routing.JavaScriptReverseRouter
import play.api.{Configuration, Environment, Mode}

@Singleton
class HomeController @Inject() (
                                 cc: ControllerComponents,
                                 input: UserInput,
                                 config: Configuration,
                                 env: Environment
                               )extends AbstractController(cc) {

  private var init = false

  def demoOfferJson: Action[JsValue] = Action(parse.json) { req =>
    val choiceOpt = (req.body \ "choice").validate[String].asOpt
    choiceOpt match {
      case Some(v) =>
        input.offer(v)
        Ok(Json.obj("message" -> routes.HomeController.ingame().url))
      case None =>
        BadRequest(Json.obj("error" -> "Missing parameter [choice]."))
    }
  }

  def jsRoutes: Action[AnyContent] = Action { implicit request: Request[AnyContent] =>
    Ok(
      JavaScriptReverseRouter("jsRoutes")(
        routes.javascript.HomeController.createPlayersJson,
        routes.javascript.HomeController.demoOfferJson,
        routes.javascript.HomeController.gameState,
        routes.javascript.HomeController.starSettings,
        routes.javascript.HomeController.playerPreset,
        routes.javascript.HomeController.savePlayersJson,
        routes.javascript.HomeController.playCardJson,
        routes.javascript.HomeController.bidJson
      )
    ).as("text/javascript")
  }

  private def spaOk(implicit request: RequestHeader) = {
    // Konfigurierte Dev‑URL erlauben, sonst Fallback
    val viteUrl = config.getOptional[String]("frontend.devUrl").getOrElse("http://localhost:5173")
    env.mode match {
      case Mode.Dev => TemporaryRedirect(viteUrl + request.uri).withHeaders("Cache-Control" -> "no-store")
      case _ =>
        // Produktion: die gebaute SPA ausliefern (z. B. aus /public/dist/index.html)
        // Falls du deinen Vite-Build nach /public/dist kopierst:
        Redirect("/assets/dist/index.html").withHeaders("Cache-Control" -> "no-store")
    }
  }

  def index(): Action[AnyContent] = Action { implicit request =>
    spaOk
  }

  def home(): Action[AnyContent] = Action { implicit request: Request[AnyContent] =>
    // Home Twirl view is being phased out in favor of Vue components.
    // Keep the route but redirect to index to avoid using home.scala.html.
    Redirect(routes.HomeController.index())
  }

  def rules(): Action[AnyContent] = Action { implicit request =>
    // Serve SPA host; frontend renders RulesPage.vue at /rules
    spaOk
  }

  def ingame(): Action[AnyContent] = Action { implicit request =>
    // TUI lazy starten
    if (!init) {
      init = true
      WebTui.userInput = input
      val thread = new Thread(() => wizard.Wizard.entry(WebConfiguration(), input))
      thread.start()
    }

    WebTui.gameLogic match {
      case None =>
        // Use the universal Vue host (index). The frontend can show a LoadingPage.vue when needed.
        spaOk

      case Some(gl) =>
        gl.getState match {
          case Some(GameState.Menu)      => spaOk
          case Some(GameState.Ingame)    => spaOk
          case Some(GameState.Endscreen) => spaOk
          case _                         => spaOk
        }
    }
  }

  def playFor(name: String): Action[AnyContent] = Action { implicit request =>
    if (!init) {
      init = true
      WebTui.userInput = input
      val thread = new Thread(() => wizard.Wizard.entry(WebConfiguration(), input))
      thread.start()
    }

    WebTui.gameLogic match {
      case None => spaOk
      case Some(gl) =>
        gl.getState match {
          case Some(GameState.Menu)      => Redirect("/menu")
          // Route to the same universal Vue host page
          case Some(GameState.Ingame)    => spaOk
          case Some(GameState.Endscreen) => Redirect("/endscreen")
          case _                         => Redirect("/rules")
        }
    }
  }

  def gameMenu(): Action[AnyContent] = Action { implicit request: Request[AnyContent] =>
    // Serve SPA host and let the frontend TuiPage.vue render the TUI output.
    // We pass the content via query parameter `tui` to avoid Twirl templates.
    val existing = request.getQueryString("tui")
    existing match {
      case Some(_) =>
        spaOk
      case None =>
        val txt = Option(WebTui.latestPrint).getOrElse("")
        val enc = java.net.URLEncoder.encode(txt, java.nio.charset.StandardCharsets.UTF_8.toString)
        Redirect("/gameMenu?tui=" + enc)
    }
  }

  def demoOffer(eingabe: String) = Action { implicit request: Request[AnyContent] =>
    val form = request.body.asFormUrlEncoded.getOrElse(Map.empty)
    input.offer(eingabe)

    val returnTo = request.getQueryString("returnTo").orElse(form.get("returnTo").flatMap(_.headOption))
    val jsonObj = Json.obj(
      "status" -> "success",
      "message" -> routes.HomeController.ingame().url
    )
    Ok(jsonObj)
  }

  def createPlayers(names: String) = Action { implicit request: Request[AnyContent] =>

    val nameList = names.split(",").map(_.trim).toList
    nameList.foreach(name => input.offer(name))
    Thread.sleep(1000)
    val jsonObj = Json.obj(
      "status" -> "success",
      "message" -> routes.HomeController.ingame().url
    )
    Ok(jsonObj)
    //    val form = request.body.asFormUrlEncoded.getOrElse(Map.empty)
    //    val name1 = form.get("name1").flatMap(_.headOption).getOrElse("")
    //    val name2 = form.get("name2").flatMap(_.headOption).getOrElse("")
    //    val name3 = form.get("name3").flatMap(_.headOption).getOrElse("")
    //
    //    input.offer(name1)
    //    input.offer(name2)
    //    input.offer(name3)
    //    Ok(s"Created players: $name1, $name2, $name3")
    //
    //    Thread.sleep(1000)
    //    val returnTo = request.getQueryString("returnTo").orElse(form.get("returnTo").flatMap(_.headOption))
    //    Redirect(returnTo.getOrElse(routes.HomeController.index().url))
  }

  def bid() = Action { implicit request: Request[AnyContent] =>
    val form = request.body.asFormUrlEncoded.getOrElse(Map.empty)
    val bid = form.get("bid").flatMap(_.headOption).getOrElse("")
    input.offer(bid)

    val returnTo = request.getQueryString("returnTo").orElse(form.get("returnTo").flatMap(_.headOption))
    Redirect(returnTo.getOrElse(routes.HomeController.index().url))
  }

  def bidJson: Action[JsValue] = Action(parse.json) { req =>
    val bidOpt: Option[String] =
      (req.body \ "bid").asOpt[String]
        .orElse((req.body \ "bid").asOpt[BigDecimal].map(_.toBigInt.toString))
        .orElse((req.body \ "bid").asOpt[BigDecimal].map(_.toLong.toString))

    val whoOpt = (req.body \ "player").asOpt[String].map(_.trim).filter(_.nonEmpty)

    (bidOpt, whoOpt) match {
      case (Some(bidStr), Some(who)) =>
        val allowed = WebTui.currentPromptPlayer.forall(_ == who)
        if (!allowed) {
          Forbidden(Json.obj("ok" -> false, "error" -> s"$who ist nicht am Zug."))
        } else {
          val bidOptInt = scala.util.Try(bidStr.trim.toInt).toOption

          val handSizeOpt: Option[Int] = WebTui.gameLogic.flatMap { gl =>
            gl.getPlayer.flatMap { players =>
              players.find(_.name == who).map(_.hand.cards.length)
            }
          }

          (bidOptInt, handSizeOpt) match {
            case (Some(bidInt), Some(handSize)) if bidInt >= 0 && bidInt <= handSize =>
              input.offer(bidStr)
              Thread.sleep(200)
              Ok(Json.obj("ok" -> true))
            case (Some(bidInt), Some(handSize)) if bidInt > handSize =>
              BadRequest(Json.obj(
                "ok" -> false,
                "error" -> s"Du kannst höchstens $handSize Stiche ansagen."
              ))
            case (Some(_), Some(_)) =>
              BadRequest(Json.obj("ok" -> false, "error" -> "Ungültige Ansage."))
            case _ =>
              BadRequest(Json.obj("ok" -> false, "error" -> "Fehlende Spielerdaten."))
          }
        }
      case (None, _) => BadRequest(Json.obj("ok" -> false, "error" -> "Missing bid"))
      case (_, None) => BadRequest(Json.obj("ok" -> false, "error" -> "Missing player"))
    }
  }

  def createPlayersJson: Action[JsValue] = Action(parse.json) { req =>
    val playersReads: Reads[List[String]] = (JsPath \ "players").read[List[String]]
    req.body.validate(playersReads).fold(
      errs => BadRequest(Json.obj("error" -> "invalid payload", "details" -> JsError.toJson(errs))),
      players => {
        val cleaned = players.map(_.trim)
        val cnt = cleaned.length
        if (cnt < 3 || cnt > 6 || cleaned.exists(_.isEmpty)) {
          BadRequest(Json.obj("error" -> "need between 3 and 6 non-empty names"))
        } else {
          // Ensure the TUI/game thread is running so it can consume the queued inputs
          if (!init) {
            init = true
            WebTui.userInput = input
            val thread = new Thread(() => wizard.Wizard.entry(WebConfiguration(), input))
            thread.start()
            // give the thread a moment to bootstrap
            try Thread.sleep(150) catch case _: Throwable => ()
          }

          // Bootstrap expected TUI flow: choose "Start Game" (1), then number of players, then names
          // Queue the inputs so the background TUI thread can consume them when active.
          input.offer("1")               // start game
          try Thread.sleep(120) catch case _: Throwable => ()
          input.offer(cnt.toString)      // number of players
          try Thread.sleep(120) catch case _: Throwable => ()
          cleaned.foreach { n =>
            input.offer(n)
            try Thread.sleep(60) catch case _: Throwable => ()
          }
          val tabs = cleaned.map(n => routes.HomeController.playFor(n).url)
          Ok(Json.obj("tabs" -> Json.toJson(tabs), "first" -> tabs.headOption.getOrElse(routes.HomeController.index().url)))
        }
      }
    )
  }

  def playerPreset(id: Long): Action[AnyContent] = Action {
    val preset = id match {
      case 1L => Json.obj("players" -> Json.arr("Jakob", "Elena", "Leon"))
      case 2L => Json.obj("players" -> Json.arr("Corina", "Shahd", "Janisette"))
      case _  => Json.obj("players" -> Json.arr("Spieler 1", "Spieler 2", "Spieler 3"))
    }
    Ok(preset)
  }

  def savePlayersJson: Action[JsValue] = Action(parse.json) { req =>
    val namesReads: Reads[List[String]] = (JsPath \ "players").read[List[String]]
    req.body.validate(namesReads).fold(
      errs => BadRequest(Json.obj("error" -> "invalid payload", "details" -> JsError.toJson(errs))),
      players => {
        val cleaned = players.map(_.trim)
        val cnt = cleaned.length
        if (cnt < 3 || cnt > 6 || cleaned.exists(_.isEmpty)) BadRequest(Json.obj("error" -> "need between 3 and 6 non-empty names"))
        else Ok(Json.obj("ok" -> true))
      }
    )
  }

  def gameState: Action[AnyContent] = Action { implicit req =>
    val stateJson: Option[JsValue] = WebTui.gameLogic.map { gl =>
      val players = gl.getPlayer.getOrElse(Nil)

      val playersJson = Json.arr(players.map { p =>
        Json.obj(
          "name" -> p.name,
          "roundBids" -> p.roundBids,
          "points" -> p.points
        )
      }*)

      def cardToUrl(card: wizard.model.cards.Card): String =
        routes.Assets.versioned("images/cards/" + (card.value match {
          case wizard.model.cards.Value.WizardKarte => "Wizard.png"
          case wizard.model.cards.Value.Chester     => "Jester.png"
          case v                                    => s"${card.color.toString}_${v.cardType()}.png"
        })).url

      val playerNameOpt = req.getQueryString("player").map(_.trim).filter(_.nonEmpty)
      val idxFromName: Option[Int] = playerNameOpt.flatMap { n =>
        val i = players.indexWhere(_.name == n)
        if (i >= 0) Some(i) else None
      }
      val meIdxOpt: Option[Int] = idxFromName.orElse(req.getQueryString("pIdx").flatMap(s => scala.util.Try(s.toInt).toOption))

      val (handsJson, handCardsJson) = if (players.nonEmpty) {
        meIdxOpt match {
          case Some(i) if i >= 0 && i < players.length =>
            val me = players(i)
            val handCards = me.hand.cards.zipWithIndex.map { case (card, idx) =>
              Json.obj(
                "id" -> (idx + 1),
                "label" -> card.toString,
                "imageUrl" -> cardToUrl(card)
              )
            }
            (Json.arr(), JsArray(handCards))
          case _ =>
            val hands = players.map { p =>
              Json.arr(p.hand.cards.zipWithIndex.map { case (card, idx) =>
                Json.obj(
                  "id" -> (idx + 1),
                  "label" -> card.toString,
                  "imageUrl" -> cardToUrl(card)
                )
              }*)
            }
            (JsArray(hands), JsArray())
        }
      } else (JsArray(), JsArray())

      val trickCardsJson = gl.getTrickCards.getOrElse(Nil).map { card =>
        Json.obj(
          "label" -> card.toString,
          "imageUrl" -> cardToUrl(card)
        )
      }

      val trumpCardJson = gl.getTrumpCard.map { card =>
        Json.obj(
          "label" -> card.toString,
          "imageUrl" -> cardToUrl(card)
        )
      }

      Json.obj(
        "players" -> playersJson,
        "hands" -> handsJson,
        "handCards" -> handCardsJson,
        "trickCards" -> trickCardsJson,
        "trumpCard" -> trumpCardJson.getOrElse(JsNull).asInstanceOf[JsValue],
        "currentPromptPlayer" -> WebTui.currentPromptPlayer.getOrElse("") ,
        "currentPromptKind" -> WebTui.currentPromptKind.getOrElse("")
      )
    }

    Ok(stateJson.getOrElse(Json.obj(
      "players" -> Json.arr(),
      "hands" -> Json.arr(),
      "handCards" -> Json.arr(),
      "trickCards" -> Json.arr(),
      "trumpCard" -> JsNull,
      "currentPromptPlayer" -> "",
      "currentPromptKind" -> ""
    )))
  }

  def playCardJson: Action[JsValue] = Action(parse.json) { req =>
    val idOpt = (req.body \ "cardId").asOpt[String]
      .orElse((req.body \ "cardId").asOpt[BigDecimal].map(_.toBigInt.toString))

    val whoOpt = (req.body \ "player").asOpt[String].map(_.trim).filter(_.nonEmpty)

    (idOpt, whoOpt) match {
      case (Some(cardIdStr), Some(who)) =>
        val allowed = WebTui.currentPromptPlayer.forall(_ == who)
        if (!allowed) {
          Forbidden(Json.obj("ok" -> false, "error" -> s"$who ist nicht am Zug."))
        } else {
          input.offer(cardIdStr)
          Thread.sleep(200)
          val state = WebTui.gameLogic.flatMap { gl =>
            gl.getPlayer.map { players =>
              def cardToUrl(card: wizard.model.cards.Card): String =
                routes.Assets.versioned("images/cards/" + (card.value match {
                  case wizard.model.cards.Value.WizardKarte => "Wizard.png"
                  case wizard.model.cards.Value.Chester     => "Jester.png"
                  case v                                    => s"${card.color.toString}_${v.cardType()}.png"
                })).url

              val handsJson = Json.arr(players.map { p =>
                Json.arr(p.hand.cards.zipWithIndex.map { case (card, idx) =>
                  Json.obj(
                    "id" -> (idx + 1),
                    "label" -> card.toString,
                    "imageUrl" -> cardToUrl(card)
                  )
                }*)
              }*)

              val trickCardsJson = gl.getTrickCards.getOrElse(Nil).map { card =>
                Json.obj(
                  "label" -> card.toString,
                  "imageUrl" -> cardToUrl(card)
                )
              }

              Json.obj(
                "hands" -> handsJson,
                "trickCards" -> trickCardsJson
              )
            }
          }.getOrElse(Json.obj("hands" -> Json.arr(), "trickCards" -> Json.arr()))

          Ok(Json.obj("ok" -> true, "state" -> state))
        }
      case (None, _) => BadRequest(Json.obj("ok" -> false, "error" -> "Missing cardId"))
      case (_, None) => BadRequest(Json.obj("ok" -> false, "error" -> "Missing player"))
    }
  }

  def starSettings: Action[AnyContent] = Action {
    Ok(Json.obj(
      "starDensity" -> 0.0009,
      "minSize" -> 0.6,
      "maxSize" -> 1.8
    ))
  }

}