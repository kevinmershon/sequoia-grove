'use strict';

/**
 * @ngdoc function
 * @name sequoiaGroveApp.controller:EmployeeCtrl
 * @description
 * # EmployeeCtrl
 * Controller for managing employees.
 */
angular.module('sequoiaGroveApp')
  .controller('EmployeeCtrl', function ($http, $log, $scope, $rootScope, $location, $mdDialog, localStorageService, userFactory) {

/************** Login Redirect, Containers and UI settings **************/

    localStorageService.set('lastPath', '/employee');

    // user is not logged in
    if ($rootScope.loggedIn == false) {
      $location.path('/login');
    }

    // TODO eventually build this object by pulling from database
    $scope.classifications = [
      {'disp':'Employee', 'val':1},
      {'disp':'Manager',  'val':2},
      {'disp':'Account Holder', 'val':3},
      {'disp':'Admin', 'val':4}
    ]
    $scope.selectedClassification = 0;

    $scope.activeTab = 'info';
    $scope.current;
    $scope.selectedEmployee = {
      'id':0,
      'classification': 0,
      'notes': '',
      'firstname':'',
      'lastname':'',
      'birthDate':'',
      'clockNumber':0,
      'email':'',
      'maxHours':'',
      'minHours':'',
      'phone':0,
      'avail':{'mon':[], 'tue':[], 'wed':[], 'thu':[], 'fri':[], 'sat':[], 'sun':[]},
      'history':[],
      'positions':[]
    };
    $scope.birthday = new Date();

    $scope.newAvail = {day:'', start:'', end:''};
    $scope.newPos = {};
    $scope.saving = false;
    $scope.typeFilter = 'current';

/************** Pure Functions **************/
    // switch filter of employee list type for all, current or past
    $scope.changeType = function(type) {
      $scope.typeFilter = type;
    }

    // filter employee list by all, current, or past employees
    $scope.filterByType = function(isCurrent) {
      if ($scope.typeFilter === 'all') {
        return true;
      }
      else if ($scope.typeFilter === 'current') {
        return isCurrent;
      }
      else if ($scope.typeFilter === 'past') {
        return !isCurrent;
      }
    }

    $scope.formatEmploymentHistory = function(dateString) {
      if (dateString=='') {
        return 'Present';
      }
      return moment(dateString,'MM-DD-YYYY').format('MMMM Do, YYYY');
    }

    // click existing times to populate input with those times
    $scope.setNewAvailTimes = function(sH, sM, eH, eM) {
      var start = moment({hour:sH, minute:sM}).format('h:mm a');
      var end = moment({hour:eH, minute:eM}).format('h:mm a');
      $scope.newAvail.start = start;
      $scope.newAvail.end = end;
    }

    $scope.selectClassification = function(index) {
      $scope.selectedClassification = index;
    }

    $scope.selectEmployee = function(id) {

      var length = $scope.employees.length;
      for(var i = 0; i < length; i++) {
        var curid = $scope.employees[i].id;
        if (curid==id) {
          $scope.selectedEmployee = $scope.employees[i];
          _.map($scope.classifications,function(item, index){
            if(parseInt(item.val) === parseInt($scope.selectedEmployee.classification)) {
              $scope.selectedClassification = index;
            }
          });
          $scope.birthday = moment($scope.employees[i].birthDate, 'MM-DD-YYYY').toDate();
          break;
        }
      }
    }

    // reset selected employee
    $scope.clearEmployee = function() {
      $scope.birthday = new Date();
      $scope.selectedEmployee = {
        'id':0,
        'classification': $scope.classifications[$scope.selectedClassification].val,
        'notes': '',
        'firstname':'',
        'lastname':'',
        'birthDate':'',
        'clockNumber':0,
        'email':'',
        'maxHours':'',
        'minHours':'',
        'phone':0,
        'avail':{'mon':[], 'tue':[], 'wed':[], 'thu':[], 'fri':[], 'sat':[], 'sun':[]},
        'history':[],
        'positions':[]
      };
    }
/************** HTTP Request Functions **************/

    // add a new availability time for an employee
    $scope.addAvailability = function() {
      // guard against double clicking
      if ($scope.saving) {
        return;
      }
      $scope.saving = true;

      var avail = {
        'eid':$scope.selectedEmployee.id,
        'day': $scope.newAvail.day,
        'start': $scope.newAvail.start.val,
        'end': $scope.newAvail.end.val
      }

      // make sure all fields are filled in
      if (avail.day!='' && avail.start!='' && avail.end!='') {

        $http({
          url: '/sequoiagrove/avail/add',
          method: "POST",
          data: avail
        }).success(function(data, status) {
          // update front end
          $scope.selectedEmployee.avail[$scope.newAvail.day].push(
            {'start':avail.start, 'end':avail.end});
          $scope.saving = false;
          $rootScope.$broadcast('editEmployee');
        }).error(function(data, status) {
          $log.debug(data, status);
        });
      }
    }

    $scope.getPositionTitle = function(pid) {
      var title = "";
      _.map($scope.positions, function(p) {
      if (p.id === parseInt(pid)) {
          title = p.title;
        }
      });
      return title;
    }

    // add a new position for an employee
    $scope.addPosition = function() {
      // guard against double clicking
      if ($scope.saving) {
        return;
      }
      $scope.saving = true;
      var pid = $scope.newPos.id;
      var obj = { 'pid':pid, 'eid':$scope.selectedEmployee.id };
      // reset input
      $scope.newPos = {};

      if ($scope.employeeHasPosition(obj.eid, pid) === false) {
        // send new position to back end
        $http({
          url: '/sequoiagrove/position/add/',
          method: "POST",
          data: obj
        }).success(function(data, status, headers, config) {
            $scope.saving = false;
            $rootScope.$broadcast('editEmployee');
            // update front end
            $scope.selectedEmployee.positions.push(pid);
        }).error(function(data, status) {
          $log.debug(status, 'failed to add position(', pid, ') for employee(', obj.eid, ')');
        });
      }
      else {
        $scope.saving = false;
      }
    }

    // remove an availability for an employee
    $scope.removeAvailability = function(day, index) {
      // guard against double clicking
      if ($scope.saving) {
        return;
      }
      $scope.saving = true;
        // update front end, and get start_time
        var start = $scope.selectedEmployee.avail[day][index].start;
        $scope.selectedEmployee.avail[day].splice(index, 1);

        // remove availability from database
        $http({
            url: '/sequoiagrove/avail/remove/'+
                $scope.selectedEmployee.id + '/' + day + '/' + start,
            method: "POST"
        }).success(function(data, status) {
          $scope.saving = false;
          $rootScope.$broadcast('editEmployee');
        });
    }

    $scope.removePosition = function(pid) {
      // guard against double clicking
      if ($scope.saving) {
        return;
      }
      $scope.saving = true;
      var eid = $scope.selectedEmployee.id;

      // remove the position from the employee (front end)
      $scope.employees = _.map($scope.employees, function(e) {
        if (parseInt(e.id) === parseInt(eid)) {
          e.positions = _.reject(e.positions, function(id) {
            return parseInt(id) === parseInt(pid);
          });
        }
        return e;
      });

      // remove position from the employee (back end)
      var obj = { 'pid':pid, 'eid':eid };
      $http({
        url: '/sequoiagrove/position/remove/',
        method: "POST",
        data: obj
      }).success(function(data, status) {
        $scope.saving = false;
        $rootScope.$broadcast('editEmployee');
      }).error(function(data, status) {
        $log.debug('error removing position',pid,'from',eid);
      });
    }

    // Update Existing employee, or add new
    $scope.updateEmployee = function(form) {
      if($rootScope.devMode) {
        $scope.saving = false;
        return;
      }
      // validate max hours per week
      if ((form.maxHours.$viewValue == '') ||
          (form.maxHours.$viewValue < 0) ||
          (form.maxHours.$viewValue > 40)) {
        $scope.selectedEmployee.maxHours = 40;
      };

      // validate min hours per week
      if ((form.minHours.$viewValue == '') ||
          (form.minHours.$viewValue > form.minHours.$viewValue) ||
          (form.minHours.$viewValue < 0)) {
        $scope.selectedEmployee.minHours = 0;
      };

      // transform firstname to uppercase first letter and lowercase for the rest
      var firstLetter = $scope.selectedEmployee.firstname.substring(0,1);
      var theRest = $scope.selectedEmployee.firstname.substring(1,
          $scope.selectedEmployee.firstname.length);

      $scope.selectedEmployee.firstname =
        (firstLetter.toUpperCase() + theRest.toLowerCase());

      // transform lastname to uppercase first letter and lowercase for the rest
      firstLetter = $scope.selectedEmployee.lastname.substring(0,1);
      theRest = $scope.selectedEmployee.lastname.substring(1,
          $scope.selectedEmployee.lastname.length);

      $scope.selectedEmployee.lastname =
        (firstLetter.toUpperCase() + theRest.toLowerCase());

      var cid = $scope.classifications[$scope.selectedClassification].val;
      $scope.selectedEmployee.classificationId = cid;
      $scope.selectedEmployee.classification = cid;

      //TODO if clock number is greater than allowed size, fix it or show error

      // validate the rest of the form
      if (form.$invalid) {
        form.firstname.$setTouched();
        form.lastname.$setTouched();
        form.email.$setTouched();
        return;
      }

      // guard against double clicking
      if ($scope.saving) {
        return;
      }
      $scope.saving = true;
      var action = "update";
      $scope.selectedEmployee.birthDate = moment($scope.birthday).format('MM-DD-YYYY');

      if ($scope.selectedEmployee.id === 0) {
        $scope.saving = false;
        action = "add";
      }

      // set null notes to empty string
      if (!$scope.selectedEmployee.notes) {
        $scope.selectedEmployee.notes = '';
      }
      $http.post("/sequoiagrove/employee/"+action, $scope.selectedEmployee)
        .success(function(data, status){
          // upate front end
          if (action === 'add') {
            $scope.selectedEmployee.isCurrent = true;
            $scope.selectedEmployee.id = data.id;
            $scope.selectedEmployee.history = [{'start': moment().format('MM-DD-YYYY'), 'end':''}];
            $scope.employees.push($scope.selectedEmployee);
          }
          $scope.selectEmployee($scope.selectedEmployee.id);
          $scope.saving = false;
          form.$setSubmitted();
        }).error(function(data, status) {
          $log.debug('error with action:', action, status,data);
        });
    }

    // Deactivate (un-employ) an employee
    $scope.deactivateEmployee = function(ev) {
      // a user shouldn't be able to unemploy themselves - it would
      // lock them out of the system.
      if ($rootScope.loggedInUser.id === $scope.selectedEmployee.id) {
        $mdDialog.show(
            $mdDialog.alert()
            .clickOutsideToClose(true)
            .title('Unemploy ' + $scope.selectedEmployee.firstname)
            .textContent('You cannot unemploy yourself!')
            .ariaLabel('cannot unemploy yourself')
            .ok('Got it!')
            .targetEvent(ev)
            );
        return
      }

      // Confirm to unemploy
      var confirm = $mdDialog.confirm()
        .title('Unemploy ' + $scope.selectedEmployee.firstname + '?')
        .ariaLabel('Unemploy')
        .targetEvent(ev)
        .ok('Unemploy')
        .cancel('Cancel');
      $mdDialog.show(confirm).then(function() {
        // ok
        $http({
          url: '/sequoiagrove/employee/deactivate/',
          method: "POST",
          data: {'id': $scope.selectedEmployee.id}
        }).success(function(data, status) {
          // update UI with change
          // FIXME if the user employs and then unemploys the same day,
          // it won't reflect the UI chnage shown
          $scope.employees = _.map($scope.employees, function(e) {
            if(e.id === $scope.selectedEmployee.id) {
              e.isCurrent = false;
              e.history = _.map(e.history, function(h) {
                if(h.end === '') {
                  h.end = moment().format('MM-DD-YYYY');
                }
                return h;
              });
            }
            return e;
          });
          $rootScope.$broadcast('editEmployee');
        }).error(function(data, status) {
          $log.debug("error deactivating employee: ", $scope.selectedEmployee.id, status);
        });
      }, function() {
        // cancel
        return;
      });
    }

    // Activate (re-employ) an employee
    $scope.activateEmployee = function() {
      $http({
        url: '/sequoiagrove/employee/activate/',
        method: "POST",
        data: {'id': $scope.selectedEmployee.id}
      }).success(function(data, status) {

        // update UI with change
        $scope.employees = _.map($scope.employees, function(e) {
          if(e.id === $scope.selectedEmployee.id) {
            e.isCurrent = true;
            e.history = _.union(e.history,
              [{'start': moment().format('MM-DD-YYYY'), 'end':''}])
          }
          return e;
        });
        $rootScope.$broadcast('editEmployee');
      }).error(function(data, status) {
        $log.debug("error activating employee: ", $scope.selectedEmployee.id, status);
      });
    }

});
