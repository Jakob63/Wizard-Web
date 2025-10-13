ThisBuild / scalaVersion := "3.5.1"

lazy val commonSettings = Seq(
  libraryDependencies += "org.scalatest" %% "scalatest" % "3.2.18" % "test",
  libraryDependencies += guice,
  Test / testOptions += Tests.Filter(_.equals("wizard.aTestSequence.TestSequence"))
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
