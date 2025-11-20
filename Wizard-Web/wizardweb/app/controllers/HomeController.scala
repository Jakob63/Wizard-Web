package controllers

import components.WebConfiguration

import javax.inject.*
import play.api.*
import play.api.libs.json.{Json, JsValue, Reads, JsPath, JsError}
import play.api.mvc.*
import wizard.controller.{GameState, aGameLogic}
import wizard.model.player.Player
import wizard.controller.controllerBaseImpl.BaseGameLogic
import wizard.model.rounds.Game
import _root_.util.UserInput
import play.api.routing.JavaScriptReverseRouter

/**
 * This controller creates an `Action` to handle HTTP requests to the
 * application's home page.
 */
@Singleton
class HomeController @Inject() (cc: ControllerComponents, input: UserInput)
  extends AbstractController(cc) {

  private var init = false

  /**
   * Create an Action to render an HTML page.
   *
   * The configuration in the `routes` file means that this method
   * will be called when the application receives a `GET` request with
   * a path of `/`.
   */

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

  def index(): Action[AnyContent] = Action { implicit request =>
    Redirect(routes.HomeController.home())
  }

  def home(): Action[AnyContent] = Action { implicit request: Request[AnyContent] =>
    Ok(views.html.home())
  }

  def rules(): Action[AnyContent] = Action { implicit request =>
    Ok(views.html.rules())
  }

  def modify(): Action[AnyContent] = Action { implicit request =>
    Ok(views.html.modify())
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
      Ok(views.html.loading(routes.HomeController.ingame().url))

    case Some(gl) =>
      gl.getState match {
        case Some(GameState.Menu)      => Ok(views.html.menu(gl))
        case Some(GameState.Ingame)    => Ok(views.html.ingame(gl))
        case Some(GameState.Endscreen) => Ok(views.html.endscreen(gl))
        case _                         => Ok(views.html.rules())
      }
  }
}

  def gameMenu(): Action[AnyContent] = Action { implicit request: Request[AnyContent] =>
    Ok(views.html.tui.apply(WebTui.latestPrint))
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
    //Redirect(returnTo.getOrElse(routes.HomeController.home().url))
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
//    Redirect(returnTo.getOrElse(routes.HomeController.home().url))
  }

  def bid() = Action { implicit request: Request[AnyContent] =>
    val form = request.body.asFormUrlEncoded.getOrElse(Map.empty)
    val bid = form.get("bid").flatMap(_.headOption).getOrElse("")
    input.offer(bid)

    val returnTo = request.getQueryString("returnTo").orElse(form.get("returnTo").flatMap(_.headOption))
    Redirect(returnTo.getOrElse(routes.HomeController.home().url))
  }

  def bidJson: Action[JsValue] = Action(parse.json) { req =>
    val bidOpt: Option[String] =
      (req.body \ "bid").asOpt[String]
        .orElse((req.body \ "bid").asOpt[BigDecimal].map(_.toBigInt.toString))
        .orElse((req.body \ "bid").asOpt[BigDecimal].map(_.toLong.toString))

    bidOpt match {
      case Some(bidStr) =>
        input.offer(bidStr)
        Thread.sleep(200)
        Ok(Json.obj("ok" -> true))
      case None =>
        BadRequest(Json.obj("ok" -> false, "error" -> "Missing bid"))
    }
  }

  def createPlayersJson: Action[JsValue] = Action(parse.json) { req =>
    val playersReads: Reads[List[String]] = (JsPath \ "players").read[List[String]]
    req.body.validate(playersReads).fold(
      errs => BadRequest(Json.obj("error" -> "invalid payload", "details" -> JsError.toJson(errs))),
      players => {
        if (players.lengthCompare(3) != 0 || players.exists(_.trim.isEmpty)) {
          BadRequest(Json.obj("error" -> "need exactly 3 non-empty names"))
        } else {
          players.foreach(n => input.offer(n))
          Ok(Json.obj("message" -> routes.HomeController.ingame().url))
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
        if (players.lengthCompare(3) != 0) BadRequest(Json.obj("error" -> "need exactly 3 names"))
        else Ok(Json.obj("ok" -> true))
      }
    )
  }

  def gameState: Action[AnyContent] = Action {
    val stateJson = WebTui.gameLogic.flatMap { gl =>
      gl.getPlayer.map { players =>
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

        val handsJson = Json.arr(players.map { p =>
          Json.arr(p.hand.cards.zipWithIndex.map { case (card, idx) =>
            Json.obj(
              "id" -> (idx + 1),
              "label" -> card.toString,
              "imageUrl" -> cardToUrl(card)
            )
          }*)
        }*)

        val firstHandJson = players.headOption.toList.flatMap(_.hand.cards.zipWithIndex.map {
          case (card, idx) => Json.obj(
            "id" -> (idx + 1),
            "label" -> card.toString,
            "imageUrl" -> cardToUrl(card)
          )
        })

        Json.obj(
          "players" -> playersJson,
          "hands" -> handsJson,
          "handCards" -> firstHandJson
        )
      }
    }

    Ok(stateJson.getOrElse(Json.obj("players" -> Json.arr(), "hands" -> Json.arr(), "handCards" -> Json.arr())))
  }

  def playCardJson: Action[JsValue] = Action(parse.json) { req =>
    val idOpt = (req.body \ "cardId").asOpt[String]
      .orElse((req.body \ "cardId").asOpt[BigDecimal].map(_.toBigInt.toString))

    idOpt match {
      case Some(cardIdStr) =>
        input.offer(cardIdStr)
        Thread.sleep(200)
        val state = Json.obj(
          "handCards" -> Json.arr()
        )
        Ok(Json.obj("ok" -> true, "state" -> state))
      case None =>
        BadRequest(Json.obj("ok" -> false, "error" -> "Missing cardId"))
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