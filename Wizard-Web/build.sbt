ThisBuild / scalaVersion := "3.5.1"

lazy val commonSettings = Seq(
  libraryDependencies += "org.scalatest" %% "scalatest" % "3.2.18" % "test",
  libraryDependencies += guice,
  Test / testOptions += Tests.Filter(_.equals("wizard.aTestSequence.TestSequence")),
  libraryDependencies += "org.scalafx" %% "scalafx" % "22.0.0-R33",
  Compile / libraryDependencies ++= {
    val os = System.getProperty("os.name").toLowerCase
    val platform =
      if (os.contains("win")) "win"
      else if (os.contains("mac")) "mac"
      else "linux"
    Seq(
      "org.openjfx" % "javafx-base" % "22.0.2" classifier platform,
      "org.openjfx" % "javafx-graphics" % "22.0.2" classifier platform,
      "org.openjfx" % "javafx-controls" % "22.0.2" classifier platform
    )
  }
)

lazy val wizard = (project in file("wizard"))
  .settings(
    commonSettings
  )

lazy val wizardweb = (project in file("wizardweb")).enablePlugins(PlayScala).dependsOn(wizard)
  .settings(
    commonSettings,
    libraryDependencies += "org.scalatestplus.play" %% "scalatestplus-play" % "7.0.0" % Test
  )

lazy val root = (project in file("."))
  .aggregate(wizardweb)
  .settings(
    name := "Wizard-Web"
  )
