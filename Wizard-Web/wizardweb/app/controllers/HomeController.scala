package controllers

import components.WebConfiguration

import javax.inject._
import play.api._
import play.api.mvc._
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
  def index(): Action[AnyContent] = Action { implicit request =>
    Redirect(routes.HomeController.home())
  }

  def home(): Action[AnyContent] = Action { implicit request: Request[AnyContent] =>
    Ok(views.html.home())
  }

  def rules(): Action[AnyContent] = Action { implicit request =>
    Ok(views.html.rules())
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
    Ok(s"offered $input")

    val returnTo = request.getQueryString("returnTo").orElse(form.get("returnTo").flatMap(_.headOption))
    Redirect(returnTo.getOrElse(routes.HomeController.home().url))
  }

  def createPlayers() = Action { implicit request: Request[AnyContent] =>
    val form = request.body.asFormUrlEncoded.getOrElse(Map.empty)
    val name1 = form.get("name1").flatMap(_.headOption).getOrElse("")
    val name2 = form.get("name2").flatMap(_.headOption).getOrElse("")
    val name3 = form.get("name3").flatMap(_.headOption).getOrElse("")

    input.offer(name1)
    input.offer(name2)
    input.offer(name3)
    Ok(s"Created players: $name1, $name2, $name3")

    Thread.sleep(1000)
    val returnTo = request.getQueryString("returnTo").orElse(form.get("returnTo").flatMap(_.headOption))
    Redirect(returnTo.getOrElse(routes.HomeController.home().url))
  }
  def bid() = Action { implicit request: Request[AnyContent] =>
    val form = request.body.asFormUrlEncoded.getOrElse(Map.empty)
    val bid = form.get("bid").flatMap(_.headOption).getOrElse("")
    input.offer(bid)

    val returnTo = request.getQueryString("returnTo").orElse(form.get("returnTo").flatMap(_.headOption))
    Redirect(returnTo.getOrElse(routes.HomeController.home().url))
  }

  def modify(): Action[AnyContent] = Action { implicit request =>
    Ok(views.html.modify())
  }
}