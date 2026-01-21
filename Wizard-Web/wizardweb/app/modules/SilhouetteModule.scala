package modules

import com.google.inject.{AbstractModule, Provides}
import utils.auth.{Environment, EventBus, IdentityService, Silhouette, SilhouetteProvider}
import utils.auth.{CookieAuthenticator, CookieAuthenticatorService, AuthenticatorService}
import models.services.UserServiceImpl
import net.codingwell.scalaguice.ScalaModule
import play.api.mvc.ControllerComponents
import utils.auth.DefaultEnv
import models.User

import scala.concurrent.ExecutionContext.Implicits.global

class SilhouetteModule extends AbstractModule with ScalaModule {

  override def configure(): Unit = {
    bind[IdentityService[User]].to[UserServiceImpl]
  }

  @Provides
  def provideSilhouette(
    env: Environment[DefaultEnv],
    cc: ControllerComponents): Silhouette[DefaultEnv] = {
    new SilhouetteProvider[DefaultEnv](env)(global, cc)
  }

  @Provides
  def provideEnvironment(
    userService: IdentityService[User],
    authenticatorService: AuthenticatorService[CookieAuthenticator]): Environment[DefaultEnv] = {

    Environment[DefaultEnv](
      userService,
      authenticatorService,
      Seq(),
      None
    )
  }

  @Provides
  def provideAuthenticatorService(
    userService: IdentityService[User]): AuthenticatorService[CookieAuthenticator] = {
    new CookieAuthenticatorService(userService)
  }
}
