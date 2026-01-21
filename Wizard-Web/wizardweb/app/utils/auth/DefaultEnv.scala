package utils.auth

trait DefaultEnv extends Env {
  type I = models.User
  type A = CookieAuthenticator
}
