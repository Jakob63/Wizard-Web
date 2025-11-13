package controllers

import components.WebConfiguration

import javax.inject.*
import play.api.*
import play.api.mvc.*
import play.api.routing.JavaScriptReverseRouter
import wizard.controller.{GameState, aGameLogic}
import wizard.model.player.Player
import wizard.controller.controllerBaseImpl.BaseGameLogic
import wizard.model.rounds.Game
import util.UserInput

class javascriptControllerRoutes @Inject() (cc: ControllerComponents, input: UserInput)
  extends AbstractController(cc) {

  def javaScriptRoutes(): Action[AnyContent] = Action { implicit request =>
    Ok(
      JavaScriptReverseRouter("jsRoutes")(
        routes.javascript.HomeController.index,
        routes.javascript.HomeController.home,
        routes.javascript.HomeController.rules,
        routes.javascript.HomeController.modify,
        routes.javascript.HomeController.ingame,
        routes.javascript.HomeController.demoOffer
      )
    ).as("text/javascript")
  }

}