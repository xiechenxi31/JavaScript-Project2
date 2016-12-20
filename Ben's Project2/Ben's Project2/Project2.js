// setup const
const smallsize = 45.5;
const mediumsize = 60;
const largesize = 75;
const extraservice = 25.5;
var app = angular.module('tidykiwi', ['ngMessages', 'ngRoute', 'firebase', 'bsActive', 'ngMap']);

app.config(configFunc);

//setup router
function configFunc($routeProvider) {
    $routeProvider.when("/", { templateUrl: "partials/home.html" });
    $routeProvider.when("/clientlist", { templateUrl: "partials/clientlist.html" });
    $routeProvider.when("/clientform", { templateUrl: "partials/clientform.html" });
    $routeProvider.when("/upcomingjobs", { templateUrl: "partials/upcomingjobs.html" });
    $routeProvider.otherwise({ redirectTo: "/" });
}

app.controller('mainctrl', mainFunc);

function mainFunc($scope, $location, $firebaseArray, $firebaseAuth, $timeout, NgMap) {
    //initialize value
    $scope.company = "Tidy Kiwi";
    $scope.isCollapsed = false;
    $scope.types = "['address']";
    $scope.comingjobs = [];    
    resetForm();
    $scope.job.next = "";
    $scope.finaldate = "";
    $scope.x = { today: "" };
    $scope.testdate = { date: "" };
    $scope.comingdate = { threedays: "" };



    //Initialize Firbase
    var config = {
        apiKey: "AIzaSyBEsdvXpodx5zMR4hdMUXKmjhW-LsMbUhs",
        authDomain: "comp322-bens-project2.firebaseapp.com",
        databaseURL: "https://comp322-bens-project2.firebaseio.com",
        storageBucket: "comp322-bens-project2.appspot.com",
        messagingSenderId: "720682897512"
    };
    firebase.initializeApp(config);
    $scope.logout = function () {
        firebase.auth().signOut();
        $scope.suername = "Not logged in";
        $location.url("/home");
    }
    $scope.emailaddress = "";
    $scope.hide = false;
    $scope.addhide = false;
    $scope.userhide = false;
    $scope.upcominghide = false;

    // login function
    $scope.login = function () {
        $firebaseAuth().$signInWithEmailAndPassword($scope.emailaddress, $scope.emailpassword)
        .then(function (auth) {

            //show different content depend on the login account
            if ($scope.emailaddress == "manager@tidykiwi.co.nz") {
                $scope.hide = true;
                $scope.userhide = true;
                $scope.addhide = true;
            }
            if ($scope.emailaddress == "firststaff@tidykiwi.co.nz") {
                $scope.hide = true;
            }
            $scope.suername = $scope.emailaddress;
            $scope.emailaddress = "";
            $scope.emailpassword = "";
            var ref = firebase.database().ref().child("Clientdata");
            $scope.joblist = $firebaseArray(ref);
            alert("Login Succeed!");

        }).catch(function (error) {
            alert("Sorry, worng emailaddress or password, try it again!");
            $scope.emailpassword = "";
        });


    }

    $scope.logout();

    // clear all content and direct to login page
    $scope.trylogout = function () {
        $scope.joblist = [];
        $scope.comingjobs = [];
        $scope.hide = false;
        $scope.addhide = false;
        $scope.suername = "Not logged in";
        $location.url("/home");
    }


    // setup today's date and created an array for the upcoming jobs.
    $scope.submittoday = function () {
        var firstdate =angular.copy($scope.x.today)
        var date = new Date(firstdate);
        $scope.comingjobs = [];
        $scope.job.next = $scope.x.today.toLocaleDateString("eu").replace(/\//g, "-");
        $scope.comingdate = date.setDate(date.getDate() + 4);

        for (i = 0; i < $scope.joblist.length; i++) {
            var adate = new Date($scope.joblist[i].next);
            var somedate = new Date($scope.comingdate);
            if (adate < somedate) {
                $scope.comingjobs.push($scope.joblist[i]);
            }
        }

        //using a loop to find out all the house size, create new object and for different googlemap icon.
        for (i = 0; i < $scope.comingjobs.length; i++) {
            if ($scope.comingjobs[i].size == "Small") {
                $scope.comingjobs[i].icon = "blue";
            }
            if ($scope.comingjobs[i].size == "Medium") {
                $scope.comingjobs[i].icon = "green";
            }
            if ($scope.comingjobs[i].size == "Large") {
                $scope.comingjobs[i].icon = "red";
            }
        }
        //show the upcomming jobs
        $scope.upcominghide = true;

        $location.url("/clientlist");

    }



    //function for sort in the upcomming jobs
    $scope.sortsuburb = function () {
        $scope.order = 'suburb';
        $scope.reverse = $scope.reverse == false ? $scope.reverse = true : $scope.reverse = false;
    }
    $scope.sortsize = function () {
        $scope.order = 'size';
        $scope.reverse = $scope.reverse == false ? $scope.reverse = true : $scope.reverse = false;
    }
    $scope.nextdate = function () {
        $scope.order = 'next';
        $scope.reverse = $scope.reverse == false ? $scope.reverse = true : $scope.reverse = false;
    }

    // reset client form
    function resetForm(){
        $scope.job = {};
        $scope.job.extras = {};
        $scope.job.location = {};
        $scope.job.schedule = "Weekly";
        $scope.editIndex = -1;
    }

    //Add new job
    $scope.addnewjobs = function () {
        $scope.editIndex = -1;
        $location.url("/clientform");
    }

    //Edit existing staff
    $scope.edit = function (jobs) {
        $scope.editIndex = $scope.joblist.indexOf(jobs);
        $scope.job = angular.copy(jobs);
        $location.url("/clientform");
    }

    //cancel edit
    $scope.canceledit = function () {
        resetForm();
        $location.url("/clientlist");
    }
    
    //Delete existing staff
    $scope.delete = function (jobs) {
        if (confirm('Are you sure to delete it?')) {
            $scope.joblist.$remove($scope.joblist.indexOf(jobs));
            var deletenum = $scope.comingjobs.indexOf(jobs);
            $scope.comingjobs.splice(deletenum, 1);
        }
        else alert('Delete canceled');
    }

    //Google search for the address
    $scope.placeChanged = function () {
        $scope.place = this.getPlace();             
        $scope.job.location.lat = $scope.place.geometry.location.lat();
        $scope.job.location.lng = $scope.place.geometry.location.lng();
        
        //check the address is in canterbury or not, if in canterbury place the revelent information, if it is not then warning the manager and clear the input
        for (i = 0; i < $scope.place.address_components.length; i++)
        {
            if ($scope.place.address_components[i].types[0] == "administrative_area_level_1")
                $scope.job.canterbury = $scope.place.address_components[i].short_name;
        }
        if ($scope.job.canterbury != "Canterbury") {
            alert("Sorry, the address must be in Canterbury.");
            $scope.job.address = "";
            $scope.job.suburb = "";
        }
        else {
            for (i = 0; i < $scope.place.address_components.length; i++) {
                if ($scope.place.address_components[i].types[0] == "sublocality_level_1")
                    $scope.job.suburb = $scope.place.address_components[i].short_name;
            }
            $scope.job.address = $scope.place.address_components[0].short_name + " " + $scope.place.address_components[1].short_name + ", " +
                $scope.place.address_components[3].short_name;
        }
    }


    //Either add the new job or update an existing one and calculated the price
    $scope.submit = function () {
        if ($scope.job.size == 'Small') {
            $scope.job.price = smallsize;
            if ($scope.job.extras.dishes) {
                $scope.job.price += extraservice;
            }
            if ($scope.job.extras.laundry) {
                $scope.job.price += extraservice;
            }
            if ($scope.job.extras.windows) {
                $scope.job.price += extraservice;
            }
        }
        if ($scope.job.size == 'Medium') {
            $scope.job.price = mediumsize;
            if ($scope.job.extras.dishes) {
                $scope.job.price += extraservice;
            }
            if ($scope.job.extras.laundry) {
                $scope.job.price += extraservice;
            }
            if ($scope.job.extras.windows) {
                $scope.job.price += extraservice;
            }
        }
        if ($scope.job.size == 'Large') {
            $scope.job.price = largesize;
            if ($scope.job.extras.dishes) {
                $scope.job.price += extraservice;
            }
            if ($scope.job.extras.laundry) {
                $scope.job.price += extraservice;
            }
            if ($scope.job.extras.windows) {
                $scope.job.price += extraservice;
            }
        }
        {
            if ($scope.editIndex >= 0) {
                $scope.joblist[$scope.editIndex] = $scope.job;
                $scope.joblist.$save($scope.job);
            }
            else {
                $scope.joblist.$add($scope.job);
            }
        }

        $location.url("/clientlist");
        resetForm();
    }



    //check a job has been down
    $scope.checkjob = function (ajob) {
        var indexnum1;
        var indexnum2;
        indexnum1 = $scope.comingjobs.indexOf(ajob);
        indexnum2 = $scope.joblist.indexOf(ajob);
        $scope.comingjobs[indexnum1].last = $scope.job.next;
       
        //update info about weekly or fortnightly
        var updatejob = angular.copy($scope.x.today);
        if ($scope.comingjobs[indexnum1].schedule == "Weekly")
            {
                var updatethree = new Date(updatejob.setDate(updatejob.getDate() + 7));
                var thenewdate = new Date(updatethree);
            }
        else if ($scope.comingjobs[indexnum1].schedule == "Fortnightly")
            {
                var updatethree = new Date(updatejob.setDate(updatejob.getDate() + 14));
                var thenewdate = new Date(updatethree);
            }

        //save the cleaning dates
            $scope.finaldate = thenewdate.toLocaleDateString("eu").replace(/\//g, "-");
            $scope.comingjobs[indexnum1].next = $scope.finaldate;
            $scope.joblist[indexnum2] = $scope.comingjobs[indexnum1];
            $scope.joblist.$save($scope.comingjobs[indexnum1]);
            $scope.comingjobs.splice(indexnum1, 1);
        
    }
    var timerPromise = null;                        //  To perform click only if there is not another click (ie dblclick)

    $scope.click = function (a) {
        var b = a;
        var dishes = "";
        var laundry = "";
        var windows = "";
        timerPromise = $timeout(function () {       // Do this if no second click in 200ms

            //find out the object by the lat and lng.
              for (i = 0; i < $scope.joblist.length; i++) {
                  if (b.latLng.lat() == $scope.joblist[i].location.lat && b.latLng.lng() == $scope.joblist[i].location.lng) {
                      var indexnumber3 = i;
                    }
              }
              if ($scope.joblist[indexnumber3].extras.dishes) {
                  dishes = " Dishes";
              }
              if ($scope.joblist[indexnumber3].extras.laundry) {
                  laundry = " Laundry";
              }
              if ($scope.joblist[indexnumber3].extras.windows) {
                  windows = " Windows";
              }
            //display the client name and the job's extras
              alert($scope.joblist[indexnumber3].name + dishes + laundry + windows);
        }, 200)
    }

    //function for check job by double click
    $scope.dblClick = function (a) {
        var b = a;
        $timeout.cancel(timerPromise);// Cancel single click action
        for (i = 0; i < $scope.joblist.length; i++) {
            if (b.latLng.lat() == $scope.joblist[i].location.lat && b.latLng.lng() == $scope.joblist[i].location.lng) {
                $scope.checkjob($scope.joblist[i]);
            }
        }
        alert("Job Checked!");
    }



}
