package controllers

import java.util.UUID
import javax.inject.Inject
import utils.auth.{LoginInfo, Silhouette, AuthenticatorService, CookieAuthenticator}
import models.User
import models.services.UserServiceImpl
import play.api.mvc.{AbstractController, ControllerComponents, Action, AnyContent}
import utils.auth.DefaultEnv
import scala.concurrent.{ExecutionContext, Future}
import play.api.libs.json.{JsValue, Json}
import utils.auth.AuthenticatorService

class SilhouetteAuthController @Inject()(
  cc: ControllerComponents,
  silhouette: Silhouette[DefaultEnv],
  userService: UserServiceImpl
)(implicit ec: ExecutionContext) extends AbstractController(cc) {

  def user = silhouette.UserAction.sync { implicit request =>
    val identity = request.identityAs[User]
    Ok(Json.obj(
      "identity" -> identity.email,
      "provider" -> identity.loginInfo.providerID
    ))
  }

  def login: Action[JsValue] = Action.async(parse.json) { implicit request =>
    val loginInfo = (request.body \ "username").asOpt[String].map(u => LoginInfo("credentials", u))
    val password = (request.body \ "password").asOpt[String]

    (loginInfo, password) match {
      case (Some(info), Some(pwd)) =>
        userService.retrieve(info).flatMap {
          case Some(user) =>
            val authService = silhouette.authenticatorServiceAs[CookieAuthenticator]
            authService.create(info).flatMap { authenticator =>
              authService.init(authenticator).flatMap { cookie =>
                authService.embed(cookie, Ok(Json.obj("message" -> "Logged in")))
              }
            }
          case None => Future.successful(Unauthorized(Json.obj("error" -> "User not found")))
        }
      case _ => Future.successful(BadRequest(Json.obj("error" -> "Missing credentials")))
    }
  }

  def signUp: Action[JsValue] = Action.async(parse.json) { implicit request =>
    val username = (request.body \ "username").asOpt[String]
    val email = (request.body \ "email").asOpt[String]
    val password = (request.body \ "password").asOpt[String]

    (username, email, password) match {
      case (Some(u), Some(e), Some(p)) =>
        val loginInfo = LoginInfo("credentials", u)
        val user = User(
          uuid = UUID.randomUUID(),
          loginInfo = loginInfo,
          firstName = None,
          lastName = None,
          fullName = Some(u),
          email = Some(e),
          avatarURL = None,
          activated = true
        )
        userService.save(user).flatMap { _ =>
          val authService = silhouette.authenticatorServiceAs[CookieAuthenticator]
          authService.create(loginInfo).flatMap { authenticator =>
            authService.init(authenticator).flatMap { cookie =>
              authService.embed(cookie, Created(Json.obj("message" -> "User created")))
            }
          }
        }
      case _ => Future.successful(BadRequest(Json.obj("error" -> "Missing data")))
    }
  }

  def signOut = silhouette.UserAction.asyncAction { implicit request =>
    val authenticator = request.authenticatorAs[CookieAuthenticator]
    silhouette.authenticatorServiceAs[CookieAuthenticator].discard(authenticator, Ok(Json.obj("message" -> "Logged out")))
  }
}
