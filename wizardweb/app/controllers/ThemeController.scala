package controllers

import javax.inject._
import play.api.mvc._

@Singleton
class ThemeController @Inject() (cc: ControllerComponents) extends AbstractController(cc) {
  private val CookieName = "theme" // Werte: "light" | "dark" | optional "auto"

  def toggleTheme(returnTo: String) = Action { implicit request: Request[AnyContent] =>
    val current = request.cookies.get(CookieName).map(_.value).getOrElse("auto")
    val next = current match {
      case "light" => "dark"
      case "dark"  => "light"
      case _        => "dark" // aus „auto“ wird „dark“
    }
    Redirect(returnTo).withCookies(Cookie(CookieName, next, maxAge = Some(365*24*60*60), httpOnly = false))
  }
}