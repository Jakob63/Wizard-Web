package controllers

import javax.inject._
import wizard.actionmanagement.Observer
import wizard.model.cards._
import wizard.model.player.Player

object WebTui extends Observer {
  override def update(updateMSG: String, obj: Any*): Unit = {
    updateMSG match {
      case "which card" => println(s"${obj.head.asInstanceOf[Player].name}, which card do you want to play?")
      case "invalid card" => println("Invalid card. Please enter a valid index.")
      case "follow lead" => println(s"You must follow the lead suit ${obj.head.asInstanceOf[Color].toString}.")
      case "which bid" => println(s"${obj.head.asInstanceOf[Player].name}, how many tricks do you bid?")
      case "invalid input, bid again" => println("Invalid input. Please enter a valid number.")
      case "print trump card" => println(s"Trump card: \n${showcard(obj.head.asInstanceOf[Card])}")
      case "cards dealt" => println("Cards have been dealt to all players.")
      case "trick winner" => println(s"${obj.head.asInstanceOf[Player].name} won the trick.")
      case "points after round" => println("Points after this round:")
      case "main menu" => gameMenu()
      case "input players" => inputPlayers()
      case "game started" => println("Game officially started.")
      case "player names" => playerNames(obj.head.asInstanceOf[Int], obj(1).asInstanceOf[Int], obj(2).asInstanceOf[List[Player]])
      //case "print points all players" => obj.head.asInstanceOf[List[Player]].foreach(player => println(s"${player.name}: ${player.points} points"))
    }
    // Fetch new data von Controller und update die View
  }

  var latestPrint: String = ""

  def gameMenu(): Unit = {
    println("Welcome to Wizard!")
    println("1. Start Game")
    println()
    println("2. Exit")
    println("Please enter your choice (1 or 2): ")
  }

  def gameMenue(): String = {
    """<h1>Welcome to Wizard!</h1>
      |<form action="/wizard/start" method="get">
      |  <button type="submit">Start Game</button>
      |</form>
      |<form action="/wizard/exit" method="get">
      |  <button type="submit">Exit</button>
      |</form>
      |""".stripMargin
  }

  def inputPlayersForm(): String = {
    """<h2>Enter number of players (3-6):</h2>
      |<form action="/wizard/players" method="post">
      |  <input type="number" name="numPlayers" min="3" max="6" required>
      |  <button type="submit">Submit</button>
      |</form>
      |""".stripMargin
  }

  def inputPlayers(): Unit = {
    println("Enter the number of players (3-6): ")
  }

  def playerNames(numPlayers: Int, current: Int, players: List[Player]): Unit = {
    println(s"Enter the name of player ${current + 1}: ")
  }

  def showHand(player: Player): Unit = {
    println(s"${player.name}'s hand: ${player.hand.cards.mkString(", ")}")
    if (player.hand.cards.isEmpty) {
      println("No cards in hand.")
    } else {
      val cardLines = player.hand.cards.map(card => showcard(card).split("\n"))
      for (i <- cardLines.head.indices) {
        println(cardLines.map(_(i)).mkString(" "))
      }
      val handString = player.hand.cards.map(card => s"${card.value.cardType()} of ${card.color}").mkString(", ")
      println(s"($handString)")
      val indices = player.hand.cards.zipWithIndex.map { case (card, index) => s"${index + 1}: ${card.value.cardType()} of ${card.color}" }
      println(s"Indices: ${indices.mkString(", ")}")
    }
  }

  def showcard(card: Card): String = {
    if (card.value == Value.Ten || card.value == Value.Eleven || card.value == Value.Twelve || card.value == Value.Thirteen) {
      s"┌─────────┐\n" +
        s"│ ${colorToAnsi(card.color)}${valueToAnsi(card.value)}${card.value.cardType()}${Console.RESET}      │\n" +
        s"│         │\n" +
        s"│         │\n" +
        s"│         │\n" +
        s"│      ${colorToAnsi(card.color)}${valueToAnsi(card.value)}${card.value.cardType()}${Console.RESET} │\n" +
        s"└─────────┘"

    } else {
      s"┌─────────┐\n" +
        s"│ ${colorToAnsi(card.color)}${valueToAnsi(card.value)}${card.value.cardType()}${Console.RESET}       │\n" +
        s"│         │\n" +
        s"│         │\n" +
        s"│         │\n" +
        s"│       ${colorToAnsi(card.color)}${valueToAnsi(card.value)}${card.value.cardType()}${Console.RESET} │\n" +
        s"└─────────┘"
    }
  }

  def printCardAtIndex(index: Int): String = {
    if (index >= 0 && index < Dealer.allCards.length) {
      showcard(Dealer.allCards(index))
    } else {
      s"Index $index is out of bounds."
    }
  }

  private def println(message: String): Unit = {
    latestPrint += message + "\n"
  }

  private def println(): Unit = {
    latestPrint += "\n"
  }
}
