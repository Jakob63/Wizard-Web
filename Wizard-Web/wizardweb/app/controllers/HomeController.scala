package controllers

import components.WebConfiguration

import javax.inject.*
import play.api.*
import play.api.mvc.*
import wizard.model.player.Player
import wizard.controller.GameLogic

/**
 * This controller creates an `Action` to handle HTTP requests to the
 * application's home page.
 */
@Singleton
class HomeController @Inject()(val controllerComponents: ControllerComponents) extends BaseController {

  private var init = false
  /**
   * Create an Action to render an HTML page.
   *
   * The configuration in the `routes` file means that this method
   * will be called when the application receives a `GET` request with
   * a path of `/`.
   */
  def index() = {
    if (!init) {
      init = true
      val thread = new Thread{wizard.Wizard.entry(WebConfiguration())}
      thread.start()
    }
    Action { implicit request: Request[AnyContent] =>
      Ok(views.html.rules())
    }
  }

//  def getTui() = Action {
//    val tui = wizard.Wizard.mesh2
//    Ok(tui)
//  }

  def gameMenu(): Action[AnyContent] = {
    Action { implicit request =>
      Ok(views.html.tui.apply(WebTui.latestPrint))
    }
  }

  def handleChoice(choice: Int) = Action {
    GameLogic.notifyObservers("handle choice", choice)
    Ok("Choice handled")
  }

  def enterPlayerNumber(playernumber: Int) = Action {
    val current = 0
    val players =  List()
    GameLogic.notifyObservers("player names", playernumber, current, List())
    Ok("Next step initiated")
  }
  
  def createPlayers() = Action {
    val player = Player("Player1")
    val player2 = Player("Player2")
    val player3 = Player("Player3")
    val players = List(player, player2, player3)
    GameLogic.createGame(players)
    Ok("names entered")
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