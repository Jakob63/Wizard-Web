package components

import controllers.WebTui
import wizard.aView.{TextUI, View}
import wizard.actionmanagement.Observer
import wizard.components.DefaultConfig

class WebConfiguration extends DefaultConfig {
  override def observables: Set[Observer] = Set(WebTui, TextUI)
  override def views: Set[View] = Set(WebTui, TextUI)
}
