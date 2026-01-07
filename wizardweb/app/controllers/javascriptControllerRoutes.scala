package controllers

import play.api.*
import play.api.mvc.*
import play.api.routing.JavaScriptReverseRouter
import util.UserInput

import javax.inject.*

class javascriptControllerRoutes @Inject() (cc: ControllerComponents, input: UserInput)
  extends AbstractController(cc) {

  def javaScriptRoutes(): Action[AnyContent] = Action { implicit request =>
    Ok(
      JavaScriptReverseRouter("jsRoutes")(
        routes.javascript.HomeController.index,
        routes.javascript.HomeController.home,
        routes.javascript.HomeController.ingame,
        routes.javascript.HomeController.demoOffer,
        routes.javascript.HomeController.createPlayers,
      )
    ).as("text/javascript")
  }

}