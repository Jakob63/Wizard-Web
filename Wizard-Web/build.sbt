import com.typesafe.sbt.less.Import.LessKeys
import com.typesafe.sbt.web.Import.Assets

ThisBuild / scalaVersion := "3.5.1"

lazy val javaFXDependencies = {
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

lazy val commonSettings = Seq(
  libraryDependencies += "org.scalatest" %% "scalatest" % "3.2.18" % "test",
  libraryDependencies += guice,
  Test / testOptions += Tests.Filter(_.equals("wizard.aTestSequence.TestSequence")),
  libraryDependencies += "org.scalafx" %% "scalafx" % "22.0.0-R33",
  libraryDependencies += "org.apache.pekko" %% "pekko-actor-typed" % "1.0.2",
  libraryDependencies += "org.apache.pekko" %% "pekko-stream" % "1.0.2",
  libraryDependencies += "org.apache.pekko" %% "pekko-http" % "1.0.1",
  libraryDependencies += "com.typesafe.play" %% "play-json" % "2.10.6",
  libraryDependencies ++= Seq(
    "net.codingwell" %% "scala-guice" % "6.0.0",
    "com.iheart" %% "ficus" % "1.5.2",
    "org.mindrot" % "jbcrypt" % "0.4"
  ),
  libraryDependencies ++= javaFXDependencies,
  resolvers += "Atlassian Releases" at "https://maven.atlassian.com/public/"
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
