package components

import controllers.WebTui
import wizard.aView.TextUI
import wizard.actionmanagement.Observer
import wizard.components.DefaultConfiguration

class WebConfiguration extends DefaultConfiguration {
  override def observables: Set[Observer] = Set(WebTui, TextUI) 
}
