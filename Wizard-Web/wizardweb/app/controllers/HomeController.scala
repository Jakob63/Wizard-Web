package controllers

import javax.inject._
import play.api._
import play.api.mvc._

/**
 * This controller creates an `Action` to handle HTTP requests to the
 * application's home page.
 */
@Singleton
class HomeController @Inject()(val controllerComponents: ControllerComponents,
                               webTui: WebTui
                              ) extends BaseController {

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
      wizard.Wizard.main(new Array[String](_length = 0))
    }
    Action { implicit request: Request[AnyContent] =>
      Ok(views.html.index())
    }
  }

  def getTui() = Action {
    val tui = wizard.Wizard.mesh2
    Ok(tui)
  }

  def gameMenu(): Action[AnyContent] = {
    Action { implicit request =>
      Ok(views.html.tui.apply(webTui.latestPrint))
    }
  }

  def makeMenu() = Action {
    val tui = webTui.gameMenu()
    Ok("cool")
  }

  def showWizard() = Action { implicit request: Request[AnyContent] =>
    Ok(webTui.gameMenue()).as(HTML)
  }
  def showPlayerForm() = Action {
    Ok(webTui.inputPlayersForm()).as(HTML)
  }
  def showCard() = Action {
    Ok(webTui.showcard(wizard.model.cards.Dealer.allCards.head)).as(HTML)
  }
}