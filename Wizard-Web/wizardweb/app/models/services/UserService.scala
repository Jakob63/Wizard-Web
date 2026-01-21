package models.services

import utils.auth.{IdentityService, LoginInfo}
import models.User
import java.util.UUID
import scala.collection.mutable
import scala.concurrent.{ExecutionContext, Future}
import javax.inject.Singleton

@Singleton
class UserServiceImpl extends IdentityService[User] {
  private val users = mutable.HashMap[UUID, User]()

  override def retrieve(loginInfo: LoginInfo): Future[Option[User]] = {
    Future.successful(users.values.find(_.loginInfo == loginInfo))
  }

  def save(user: User): Future[User] = {
    users += (user.uuid -> user)
    Future.successful(user)
  }
}
