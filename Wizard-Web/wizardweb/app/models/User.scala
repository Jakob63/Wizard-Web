package models

import java.util.UUID
import utils.auth.{Identity, LoginInfo}

case class User(
  uuid: UUID,
  loginInfo: LoginInfo,
  firstName: Option[String],
  lastName: Option[String],
  fullName: Option[String],
  email: Option[String],
  avatarURL: Option[String],
  activated: Boolean
) extends Identity
