import com.google.inject.AbstractModule
import util.{QueueInput, UserInput}

class Module extends AbstractModule {
  override def configure(): Unit = {
    bind(classOf[UserInput]).to(classOf[QueueInput])
  }
}