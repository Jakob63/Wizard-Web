package controllers

import components.WebConfiguration

import javax.inject.*
import play.api.*
import play.api.mvc.*
import wizard.controller.{GameState, aGameLogic}
import wizard.model.player.Player
import wizard.controller.controllerBaseImpl.BaseGameLogic
import wizard.model.rounds.Game
import util.UserInput

/**
 * This controller creates an `Action` to handle HTTP requests to the
 * application's home page.
 */
@Singleton
class HomeController @Inject()(val controllerComponents: ControllerComponents, input: UserInput)
  extends BaseController {

  private var init = false
  /**
   * Create an Action to render an HTML page.
   *
   * The configuration in the `routes` file means that this method
   * will be called when the application receives a `GET` request with
   * a path of `/`.
   */
  def index(): Action[AnyContent] = Action { implicit request: Request[AnyContent] =>
    if (!init) {
      init = true

      // Web-Spezifische View hier verdrahten:
      WebTui.userInput = input

      val thread = new Thread(() => wizard.Wizard.entry(WebConfiguration(), input))
      thread.start()
    }
    Ok(views.html.rules())
  }
  
  def ingame(): Action[AnyContent] = Action { implicit request: Request[AnyContent] =>
      val state = WebTui.gameLogic.get.getState.get
      println(state)
      if (state == GameState.Menu) {
        Ok(views.html.menu(WebTui.gameLogic.get))
      } else if (state == GameState.Ingame) {
        Ok(views.html.ingame(WebTui.gameLogic.get))
      } else if (state == GameState.Endscreen) {
        Ok(views.html.endscreen(WebTui.gameLogic.get))
      } else {
        Ok(views.html.rules())
      }

  }

//  def getTui() = Action {
//    val tui = wizard.Wizard.mesh2
//    Ok(tui)
//  }

  def gameMenu(): Action[AnyContent] = Action { implicit request: Request[AnyContent] =>
    Ok(views.html.tui.apply(WebTui.latestPrint))
  }

  def handleChoice(choice: Int) = Action {
    WebTui.gameLogic.get.handleChoice(choice)
    Ok("Choice handled")
  }

  def enterPlayerNumber(playernumber: Int) = Action {
    val current = 0
    val players =  List()
    WebTui.gameLogic.get.enterPlayerNumber(playernumber, current, players)
    Ok("Next step initiated")
  }
  
  def createPlayers(name_1: String, name_2: String, name_3: String) = Action {
    val player1 = Player(name_1)
    val player2 = Player(name_2)
    val player3 = Player(name_3)
    val players = List(player1, player2, player3)
    WebTui.gameLogic.get.createGame(players)
    Ok("names entered")
  }
  
  def playRound() = Action {
    val player = Player("Player1")
    val player2 = Player("Player2")
    val player3 = Player("Player3")
    val players = List(player, player2, player3)
    var game = Game(players)
    WebTui.gameLogic.get.playGame(game, players)
    Ok("started")
  }

  def playRound8() = Action {
    val player = Player("Player1")
    val player2 = Player("Player2")
    val player3 = Player("Player3")
    val players = List(player, player2, player3)
    WebTui.gameLogic.get.playRound(8, players)
    Ok("round played")
  }

  // NEW: nimmt Text aus Form-POST (x-www-form-urlencoded) und bietet ihn an
  def offer(): Action[Map[String, Seq[String]]] = Action(parse.formUrlEncoded) { (request: Request[Map[String, Seq[String]]]) =>
    val text = request.body.get("text").flatMap(_.headOption).getOrElse("")
    input.offer(text)
    Ok("offered")
  }

  // NEW: bequemes Angebot eines leeren Strings per GET (z. B. um zu "+triggern+")
  def offerEmpty() = Action {
    input.offer("")
    Ok("offered empty")
  }

  def demoOffer(eingabe: String) = Action {
    input.offer(eingabe)
    Ok(s"offered $input")
  }

//  def makeMenu() = Action {
//    val tui = WebTui2.gameMenu()
//    Ok("cool")
//  }

//  def showWizard() = Action { implicit request: Request[AnyContent] =>
//    Ok(webTui2.gameMenue()).as(HTML)
//  }
//  def showPlayerForm() = Action {
//    Ok(webTui2.inputPlayersForm()).as(HTML)
//  }
//  def showCard() = Action {
//    Ok(webTui2.showcard(wizard.model.cards.Dealer.allCards.head)).as(HTML)
//  }
}