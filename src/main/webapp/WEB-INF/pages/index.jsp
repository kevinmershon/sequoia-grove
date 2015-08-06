<!doctype html>
<%@ taglib prefix="c" uri="http://java.sun.com/jsp/jstl/core"%>
<html>

  <head>
    <meta charset="utf-8">
    <title></title>
    <meta name="description" content="">
    <meta name="viewport" content="width=device-width">
    <!-- Place favicon.ico and apple-touch-icon.png in the root directory -->
    <!-- build:css(.) styles/vendor.css -->
    <!-- bower:css -->
    <!-- endbower -->
    <!-- endbuild -->
    <!-- build:css(.tmp) styles/main.css -->
    <link rel="stylesheet" href="css/style.css">
    <!-- endbuild -->
  </head>
  <body ng-controller="carsCtrl">
    <!--[if lte IE 8]>
      <p class="browsehappy">You are using an <strong>outdated</strong> browser. Please <a href="http://browsehappy.com/">upgrade your browser</a> to improve your experience.</p>
    <![endif]-->

    <!-- Header
    <header-menu></header-menu>
    -->

    <!-- main view <div id="main-content" class="container-fluid" ng-view=""></div> -->

    <!-- sample view -->
        <div class="carsFrame">
            <!-- JSTL: This part is used to load just the first 3 cars-->
            <c:forEach var="car" items="${cars.carList}">
            <div class="carsFrame">
                <img src="${car.src}"/>
                <h1>${car.name}</h1>
            </div>
            </c:forEach>

            <!-- AngularJS manages cars injection after have loaded the 3 first-->
            <!-- We use ng-src instead src because src does not work in elements generated by AngularJS  -->
            <div ng-repeat="car in cars" class="carsFrame">
                <img ng-src="{{car.src}}"/>
                <h1>{{car.name}}</h1>
            </div>
        </div>

        <div id="button_container">
            <!-- ng-click binds click event with AngularJS $scope-->
            <!-- Load function is implemented in the controller -->
            <!-- As I said in the controller javascript cannot know the context, so we give it as a parameter-->
            <button type="button" class="btn btn-xlarge btn-primary" ng-click="load('${pageContext.request.contextPath}')">3 more...</button>
        </div>

    <!-- footer
    <footer-menu></footer-menu>
    -->

    <!-- build:js(.) scripts/vendor.js -->
    <!-- bower:js -->
    <script src="bower_components/jquery/dist/jquery.js"></script>
    <script src="bower_components/angular/angular.js"></script>
    <script src="bower_components/bootstrap-sass-official/assets/javascripts/bootstrap.js"></script>
    <script src="bower_components/angular-animate/angular-animate.js"></script>
    <script src="bower_components/angular-cookies/angular-cookies.js"></script>
    <script src="bower_components/angular-resource/angular-resource.js"></script>
    <script src="bower_components/angular-route/angular-route.js"></script>
    <script src="bower_components/angular-sanitize/angular-sanitize.js"></script>
    <script src="bower_components/angular-touch/angular-touch.js"></script>
    <script src="bower_components/angular-translate/angular-translate.js"></script>
    <script src="bower_components/angular-local-storage/dist/angular-local-storage.js"></script>
    <script src="bower_components/angular-translate-loader-static-files/angular-translate-loader-static-files.js"></script>
    <!-- endbower -->
    <!-- endbuild -->

        <!-- build:js({.tmp,app}) scripts/scripts.js -->
        <script src="js/controller.js"></script><!-- our controller -->
        <!-- endbuild -->
</body>
</html>

