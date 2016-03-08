/*!
 * ui-select
 * http://github.com/angular-ui/ui-select
 * Version: 0.14.2 - 2016-03-08T07:58:16.950Z
 * License: MIT
 */


(function () { 
"use strict";
var KEY = {
    TAB: 9,
    ENTER: 13,
    ESC: 27,
    SPACE: 32,
    LEFT: 37,
    UP: 38,
    RIGHT: 39,
    DOWN: 40,
    SHIFT: 16,
    CTRL: 17,
    ALT: 18,
    PAGE_UP: 33,
    PAGE_DOWN: 34,
    HOME: 36,
    END: 35,
    BACKSPACE: 8,
    DELETE: 46,
    COMMAND: 91,

    MAP: { 91 : "COMMAND", 8 : "BACKSPACE" , 9 : "TAB" , 13 : "ENTER" , 16 : "SHIFT" , 17 : "CTRL" , 18 : "ALT" , 19 : "PAUSEBREAK" , 20 : "CAPSLOCK" , 27 : "ESC" , 32 : "SPACE" , 33 : "PAGE_UP", 34 : "PAGE_DOWN" , 35 : "END" , 36 : "HOME" , 37 : "LEFT" , 38 : "UP" , 39 : "RIGHT" , 40 : "DOWN" , 43 : "+" , 44 : "PRINTSCREEN" , 45 : "INSERT" , 46 : "DELETE", 48 : "0" , 49 : "1" , 50 : "2" , 51 : "3" , 52 : "4" , 53 : "5" , 54 : "6" , 55 : "7" , 56 : "8" , 57 : "9" , 59 : ";", 61 : "=" , 65 : "A" , 66 : "B" , 67 : "C" , 68 : "D" , 69 : "E" , 70 : "F" , 71 : "G" , 72 : "H" , 73 : "I" , 74 : "J" , 75 : "K" , 76 : "L", 77 : "M" , 78 : "N" , 79 : "O" , 80 : "P" , 81 : "Q" , 82 : "R" , 83 : "S" , 84 : "T" , 85 : "U" , 86 : "V" , 87 : "W" , 88 : "X" , 89 : "Y" , 90 : "Z", 96 : "0" , 97 : "1" , 98 : "2" , 99 : "3" , 100 : "4" , 101 : "5" , 102 : "6" , 103 : "7" , 104 : "8" , 105 : "9", 106 : "*" , 107 : "+" , 109 : "-" , 110 : "." , 111 : "/", 112 : "F1" , 113 : "F2" , 114 : "F3" , 115 : "F4" , 116 : "F5" , 117 : "F6" , 118 : "F7" , 119 : "F8" , 120 : "F9" , 121 : "F10" , 122 : "F11" , 123 : "F12", 144 : "NUMLOCK" , 145 : "SCROLLLOCK" , 186 : ";" , 187 : "=" , 188 : "," , 189 : "-" , 190 : "." , 191 : "/" , 192 : "`" , 219 : "[" , 220 : "\\" , 221 : "]" , 222 : "'"
    },

    isControl: function (e) {
        var k = e.which;
        switch (k) {
        case KEY.COMMAND:
        case KEY.SHIFT:
        case KEY.CTRL:
        case KEY.ALT:
            return true;
        }

        if (e.metaKey) return true;

        return false;
    },
    isFunctionKey: function (k) {
        k = k.which ? k.which : k;
        return k >= 112 && k <= 123;
    },
    isVerticalMovement: function (k){
      return ~[KEY.UP, KEY.DOWN].indexOf(k);
    },
    isHorizontalMovement: function (k){
      return ~[KEY.LEFT,KEY.RIGHT,KEY.BACKSPACE,KEY.DELETE].indexOf(k);
    },
    toSeparator: function (k) {
      var sep = {ENTER:"\n",TAB:"\t",SPACE:" "}[k];
      if (sep) return sep;
      // return undefined for special keys other than enter, tab or space.
      // no way to use them to cut strings.
      return KEY[k] ? undefined : k;
    }
  };

/**
 * Add querySelectorAll() to jqLite.
 *
 * jqLite find() is limited to lookups by tag name.
 * TODO This will change with future versions of AngularJS, to be removed when this happens
 *
 * See jqLite.find - why not use querySelectorAll? https://github.com/angular/angular.js/issues/3586
 * See feat(jqLite): use querySelectorAll instead of getElementsByTagName in jqLite.find https://github.com/angular/angular.js/pull/3598
 */
if (angular.element.prototype.querySelectorAll === undefined) {
  angular.element.prototype.querySelectorAll = function(selector) {
    return angular.element(this[0].querySelectorAll(selector));
  };
}

/**
 * Add closest() to jqLite.
 */
if (angular.element.prototype.closest === undefined) {
  angular.element.prototype.closest = function( selector) {
    var elem = this[0];
    var matchesSelector = elem.matches || elem.webkitMatchesSelector || elem.mozMatchesSelector || elem.msMatchesSelector;

    while (elem) {
      if (matchesSelector.bind(elem)(selector)) {
        return elem;
      } else {
        elem = elem.parentElement;
      }
    }
    return false;
  };
}

var latestId = 0;

var uis = angular.module('ui.select', [])

.constant('uiSelectConfig', {
  theme: 'bootstrap',
  searchEnabled: true,
  sortable: false,
  placeholder: '', // Empty by default, like HTML tag <select>
  refreshDelay: 1000, // In milliseconds
  closeOnSelect: true,
  dropdownPosition: 'auto',
  generateId: function() {
    return latestId++;
  },
  appendToBody: false
})

// See Rename minErr and make it accessible from outside https://github.com/angular/angular.js/issues/6913
.service('uiSelectMinErr', function() {
  var minErr = angular.$$minErr('ui.select');
  return function() {
    var error = minErr.apply(this, arguments);
    var message = error.message.replace(new RegExp('\nhttp://errors.angularjs.org/.*'), '');
    return new Error(message);
  };
})

// Recreates old behavior of ng-transclude. Used internally.
.directive('uisTranscludeAppend', function () {
  return {
    link: function (scope, element, attrs, ctrl, transclude) {
        transclude(scope, function (clone) {
          element.append(clone);
        });
      }
    };
})

/**
 * Highlights text that matches $select.search.
 *
 * Taken from AngularUI Bootstrap Typeahead
 * See https://github.com/angular-ui/bootstrap/blob/0.10.0/src/typeahead/typeahead.js#L340
 */
.filter('highlight', function() {
  function escapeRegexp(queryToEscape) {
    return ('' + queryToEscape).replace(/([.?*+^$[\]\\(){}|-])/g, '\\$1');
  }

  return function(matchItem, query) {
    return query && matchItem ? ('' + matchItem).replace(new RegExp(escapeRegexp(query), 'gi'), '<span class="ui-select-highlight">$&</span>') : matchItem;
  };
})

/**
 * A read-only equivalent of jQuery's offset function: http://api.jquery.com/offset/
 *
 * Taken from AngularUI Bootstrap Position:
 * See https://github.com/angular-ui/bootstrap/blob/master/src/position/position.js#L70
 */
.factory('uisOffset',
  ['$document', '$window',
  function ($document, $window) {

  return function(element) {
    var boundingClientRect = element[0].getBoundingClientRect();
    return {
      width: boundingClientRect.width || element.prop('offsetWidth'),
      height: boundingClientRect.height || element.prop('offsetHeight'),
      top: boundingClientRect.top + ($window.pageYOffset || $document[0].documentElement.scrollTop),
      left: boundingClientRect.left + ($window.pageXOffset || $document[0].documentElement.scrollLeft)
    };
  };
}]);

uis.directive('uiSelectChoices',
  ['uiSelectConfig', 'uisRepeatParser', 'uiSelectMinErr', '$compile',
  function(uiSelectConfig, RepeatParser, uiSelectMinErr, $compile) {

  return {
    restrict: 'EA',
    require: '^uiSelect',
    replace: true,
    transclude: true,
    templateUrl: function(tElement) {
      // Gets theme attribute from parent (ui-select)
      var theme = tElement.parent().attr('theme') || uiSelectConfig.theme;
      return theme + '/choices.tpl.html';
    },

    compile: function(tElement, tAttrs) {

      if (!tAttrs.repeat) throw uiSelectMinErr('repeat', "Expected 'repeat' expression.");

      return function link(scope, element, attrs, $select, transcludeFn) {

        // var repeat = RepeatParser.parse(attrs.repeat);
        var groupByExp = attrs.groupBy;
        var groupFilterExp = attrs.groupFilter;

        $select.parseRepeatAttr(attrs.repeat, groupByExp, groupFilterExp); //Result ready at $select.parserResult

        $select.disableChoiceExpression = attrs.uiDisableChoice;
        $select.onHighlightCallback = attrs.onHighlight;

        $select.dropdownPosition = attrs.position ? attrs.position.toLowerCase() : uiSelectConfig.dropdownPosition;

        if(groupByExp) {
          var groups = element.querySelectorAll('.ui-select-choices-group');
          if (groups.length !== 1) throw uiSelectMinErr('rows', "Expected 1 .ui-select-choices-group but got '{0}'.", groups.length);
          groups.attr('ng-repeat', RepeatParser.getGroupNgRepeatExpression());
        }

        var choices = element.querySelectorAll('.ui-select-choices-row');
        if (choices.length !== 1) {
          throw uiSelectMinErr('rows', "Expected 1 .ui-select-choices-row but got '{0}'.", choices.length);
        }

        choices.attr('ng-repeat', $select.parserResult.repeatExpression(groupByExp))
            .attr('ng-if', '$select.open') //Prevent unnecessary watches when dropdown is closed
            .attr('ng-click', '$select.select(' + $select.parserResult.itemName + ',false,$event)');

        var rowsInner = element.querySelectorAll('.ui-select-choices-row-inner');
        if (rowsInner.length !== 1) throw uiSelectMinErr('rows', "Expected 1 .ui-select-choices-row-inner but got '{0}'.", rowsInner.length);
        rowsInner.attr('uis-transclude-append', ''); //Adding uisTranscludeAppend directive to row element after choices element has ngRepeat

        $compile(element, transcludeFn)(scope); //Passing current transcludeFn to be able to append elements correctly from uisTranscludeAppend

        scope.$watch('$select.search', function(newValue) {
          if(newValue && !$select.open && $select.multiple) $select.activate(false, true);
          $select.activeIndex = $select.tagging.isActivated ? -1 : 0;
          if (!attrs.minimumInputLength || $select.search.length >= attrs.minimumInputLength) {
            $select.refresh(attrs.refresh);
          } else {
            $select.items = [];
          }
        });

        attrs.$observe('refreshDelay', function() {
          // $eval() is needed otherwise we get a string instead of a number
          var refreshDelay = scope.$eval(attrs.refreshDelay);
          $select.refreshDelay = refreshDelay !== undefined ? refreshDelay : uiSelectConfig.refreshDelay;
        });
      };
    }
  };
}]);

/**
 * Contains ui-select "intelligence".
 *
 * The goal is to limit dependency on the DOM whenever possible and
 * put as much logic in the controller (instead of the link functions) as possible so it can be easily tested.
 */
uis.controller('uiSelectCtrl',
  ['$scope', '$element', '$timeout', '$filter', 'uisRepeatParser', 'uiSelectMinErr', 'uiSelectConfig', '$parse', '$injector',
  function($scope, $element, $timeout, $filter, RepeatParser, uiSelectMinErr, uiSelectConfig, $parse, $injector) {

  var ctrl = this;

  var EMPTY_SEARCH = '';

  ctrl.placeholder = uiSelectConfig.placeholder;
  ctrl.searchEnabled = uiSelectConfig.searchEnabled;
  ctrl.sortable = uiSelectConfig.sortable;
  ctrl.refreshDelay = uiSelectConfig.refreshDelay;

  ctrl.removeSelected = false; //If selected item(s) should be removed from dropdown list
  ctrl.closeOnSelect = true; //Initialized inside uiSelect directive link function
  ctrl.search = EMPTY_SEARCH;

  ctrl.activeIndex = 0; //Dropdown of choices
  ctrl.items = []; //All available choices

  ctrl.open = false;
  ctrl.focus = false;
  ctrl.disabled = false;
  ctrl.selected = undefined;

  ctrl.dropdownPosition = 'auto';

  ctrl.focusser = undefined; //Reference to input element used to handle focus events
  ctrl.resetSearchInput = true;
  ctrl.multiple = undefined; // Initialized inside uiSelect directive link function
  ctrl.disableChoiceExpression = undefined; // Initialized inside uiSelectChoices directive link function
  ctrl.tagging = {isActivated: false, fct: undefined};
  ctrl.taggingTokens = {isActivated: false, tokens: undefined};
  ctrl.lockChoiceExpression = undefined; // Initialized inside uiSelectMatch directive link function
  ctrl.clickTriggeredSelect = false;
  ctrl.$filter = $filter;

  // Use $injector to check for $animate and store a reference to it
  ctrl.$animate = (function () {
    try {
      return $injector.get('$animate');
    } catch (err) {
      // $animate does not exist
      return null;
    }
  })();

  ctrl.searchInput = $element.querySelectorAll('input.ui-select-search');
  if (ctrl.searchInput.length !== 1) {
    throw uiSelectMinErr('searchInput', "Expected 1 input.ui-select-search but got '{0}'.", ctrl.searchInput.length);
  }

  ctrl.isEmpty = function() {
    return angular.isUndefined(ctrl.selected) || ctrl.selected === null || ctrl.selected === '' || (ctrl.multiple && ctrl.selected.length === 0);
  };

  // Most of the time the user does not want to empty the search input when in typeahead mode
  function _resetSearchInput() {
    if (ctrl.resetSearchInput || (ctrl.resetSearchInput === undefined && uiSelectConfig.resetSearchInput)) {
      ctrl.search = EMPTY_SEARCH;
      //reset activeIndex
      if (ctrl.selected && ctrl.items.length && !ctrl.multiple) {
        ctrl.activeIndex = ctrl.items.findIndex(function(item){
          return angular.equals(this, item);
        }, ctrl.selected);
      }
    }
  }

    function _groupsFilter(groups, groupNames) {
      var i, j, result = [];
      for(i = 0; i < groupNames.length ;i++){
        for(j = 0; j < groups.length ;j++){
          if(groups[j].name == [groupNames[i]]){
            result.push(groups[j]);
          }
        }
      }
      return result;
    }

  // When the user clicks on ui-select, displays the dropdown list
  ctrl.activate = function(initSearchValue, avoidReset) {
    if (!ctrl.disabled  && !ctrl.open) {
      if(!avoidReset) _resetSearchInput();

      $scope.$broadcast('uis:activate');

      ctrl.open = true;

      ctrl.activeIndex = ctrl.activeIndex >= ctrl.items.length ? 0 : ctrl.activeIndex;

      // ensure that the index is set to zero for tagging variants
      // that where first option is auto-selected
      if ( ctrl.activeIndex === -1 && ctrl.taggingLabel !== false ) {
        ctrl.activeIndex = 0;
      }

      var container = $element.querySelectorAll('.ui-select-choices-content');
      if (ctrl.$animate && ctrl.$animate.enabled(container[0])) {
        ctrl.$animate.on('enter', container[0], function (elem, phase) {
          if (phase === 'close') {
            // Only focus input after the animation has finished
            $timeout(function () {
              ctrl.focusSearchInput(initSearchValue);
            });
          }
        });
      } else {
        $timeout(function () {
          ctrl.focusSearchInput(initSearchValue);
        });
      }
    }
  };

  ctrl.focusSearchInput = function (initSearchValue) {
    ctrl.search = initSearchValue || ctrl.search;
    ctrl.searchInput[0].focus();
    if(!ctrl.tagging.isActivated && ctrl.items.length > 1) {
     _ensureHighlightVisible();
    }
  };

  ctrl.findGroupByName = function(name) {
    return ctrl.groups && ctrl.groups.filter(function(group) {
      return group.name === name;
    })[0];
  };

  ctrl.parseRepeatAttr = function(repeatAttr, groupByExp, groupFilterExp) {
    function updateGroups(items) {
      var groupFn = $scope.$eval(groupByExp);
      ctrl.groups = [];
      angular.forEach(items, function(item) {
        var groupName = angular.isFunction(groupFn) ? groupFn(item) : item[groupFn];
        var group = ctrl.findGroupByName(groupName);
        if(group) {
          group.items.push(item);
        }
        else {
          ctrl.groups.push({name: groupName, items: [item]});
        }
      });
      if(groupFilterExp){
        var groupFilterFn = $scope.$eval(groupFilterExp);
        if( angular.isFunction(groupFilterFn)){
          ctrl.groups = groupFilterFn(ctrl.groups);
        } else if(angular.isArray(groupFilterFn)){
          ctrl.groups = _groupsFilter(ctrl.groups, groupFilterFn);
        }
      }
      ctrl.items = [];
      ctrl.groups.forEach(function(group) {
        ctrl.items = ctrl.items.concat(group.items);
      });
    }

    function setPlainItems(items) {
      ctrl.items = items;
    }

    ctrl.setItemsFn = groupByExp ? updateGroups : setPlainItems;

    ctrl.parserResult = RepeatParser.parse(repeatAttr);

    ctrl.isGrouped = !!groupByExp;
    ctrl.itemProperty = ctrl.parserResult.itemName;

    //If collection is an Object, convert it to Array

    var originalSource = ctrl.parserResult.source;

    //When an object is used as source, we better create an array and use it as 'source'
    var createArrayFromObject = function(){
      var origSrc = originalSource($scope);
      $scope.$uisSource = Object.keys(origSrc).map(function(v){
        var result = {};
        result[ctrl.parserResult.keyName] = v;
        result.value = origSrc[v];
        return result;
      });
    };

    if (ctrl.parserResult.keyName){ // Check for (key,value) syntax
      createArrayFromObject();
      ctrl.parserResult.source = $parse('$uisSource' + ctrl.parserResult.filters);
      $scope.$watch(originalSource, function(newVal, oldVal){
        if (newVal !== oldVal) createArrayFromObject();
      }, true);
    }

    ctrl.refreshItems = function (data){
      data = data || ctrl.parserResult.source($scope);
      var selectedItems = ctrl.selected;
      //TODO should implement for single mode removeSelected
      if (ctrl.isEmpty() || (angular.isArray(selectedItems) && !selectedItems.length) || !ctrl.removeSelected) {
        ctrl.setItemsFn(data);
      }else{
        if ( data !== undefined ) {
          var filteredItems = data.filter(function(i) {return selectedItems && selectedItems.indexOf(i) < 0;});
          ctrl.setItemsFn(filteredItems);
        }
      }
      if (ctrl.dropdownPosition === 'auto' || ctrl.dropdownPosition === 'up'){
        $scope.calculateDropdownPos();
      }
    };

    // See https://github.com/angular/angular.js/blob/v1.2.15/src/ng/directive/ngRepeat.js#L259
    $scope.$watchCollection(ctrl.parserResult.source, function(items) {
      if (items === undefined || items === null) {
        // If the user specifies undefined or null => reset the collection
        // Special case: items can be undefined if the user did not initialized the collection on the scope
        // i.e $scope.addresses = [] is missing
        ctrl.items = [];
      } else {
        if (!angular.isArray(items)) {
          throw uiSelectMinErr('items', "Expected an array but got '{0}'.", items);
        } else {
          //Remove already selected items (ex: while searching)
          //TODO Should add a test
          ctrl.refreshItems(items);
          ctrl.ngModel.$modelValue = null; //Force scope model value and ngModel value to be out of sync to re-run formatters
        }
      }
    });

  };

  var _refreshDelayPromise;

  /**
   * Typeahead mode: lets the user refresh the collection using his own function.
   *
   * See Expose $select.search for external / remote filtering https://github.com/angular-ui/ui-select/pull/31
   */
  ctrl.refresh = function(refreshAttr) {
    if (refreshAttr !== undefined) {

      // Debounce
      // See https://github.com/angular-ui/bootstrap/blob/0.10.0/src/typeahead/typeahead.js#L155
      // FYI AngularStrap typeahead does not have debouncing: https://github.com/mgcrea/angular-strap/blob/v2.0.0-rc.4/src/typeahead/typeahead.js#L177
      if (_refreshDelayPromise) {
        $timeout.cancel(_refreshDelayPromise);
      }
      _refreshDelayPromise = $timeout(function() {
        $scope.$eval(refreshAttr);
      }, ctrl.refreshDelay);
    }
  };

  ctrl.isActive = function(itemScope) {
    if ( !ctrl.open ) {
      return false;
    }
    if(!ctrl.items){
      ctrl.items = [];
    }
    var itemIndex = ctrl.items.indexOf(itemScope[ctrl.itemProperty]);
    var isActive =  itemIndex == ctrl.activeIndex;

    if ( !isActive || ( itemIndex < 0 && ctrl.taggingLabel !== false ) ||( itemIndex < 0 && ctrl.taggingLabel === false) ) {
      return false;
    }

    if (isActive && !angular.isUndefined(ctrl.onHighlightCallback)) {
      itemScope.$eval(ctrl.onHighlightCallback);
    }

    return isActive;
  };

  ctrl.isDisabled = function(itemScope) {

    if (!ctrl.open) return;
    if(!ctrl.items){
      ctrl.items = [];
    }
    var itemIndex = ctrl.items.indexOf(itemScope[ctrl.itemProperty]);
    var isDisabled = false;
    var item;

    if (itemIndex >= 0 && !angular.isUndefined(ctrl.disableChoiceExpression)) {
      item = ctrl.items[itemIndex];
      isDisabled = !!(itemScope.$eval(ctrl.disableChoiceExpression)); // force the boolean value
      item._uiSelectChoiceDisabled = isDisabled; // store this for later reference
    }

    return isDisabled;
  };


  // When the user selects an item with ENTER or clicks the dropdown
  ctrl.select = function(item, skipFocusser, $event) {
    if (item === undefined) return;
    if (item === undefined || !item._uiSelectChoiceDisabled) {

      if ( ! ctrl.items && ! ctrl.search && ! ctrl.tagging.isActivated) return;

      if (!item || !item._uiSelectChoiceDisabled) {
        if(ctrl.tagging.isActivated) {
          // if taggingLabel is disabled, we pull from ctrl.search val
          if ( ctrl.taggingLabel === false ) {
            if ( ctrl.activeIndex < 0 ) {
              item = ctrl.tagging.fct !== undefined ? ctrl.tagging.fct(ctrl.search) : ctrl.search;
              if (!item || angular.equals( ctrl.items[0], item ) ) {
                return;
              }
            } else {
              // keyboard nav happened first, user selected from dropdown
              item = ctrl.items[ctrl.activeIndex];
            }
          } else {
            // tagging always operates at index zero, taggingLabel === false pushes
            // the ctrl.search value without having it injected
            if ( ctrl.activeIndex === 0 ) {
              // ctrl.tagging pushes items to ctrl.items, so we only have empty val
              // for `item` if it is a detected duplicate
              if ( item === undefined ) return;

              // create new item on the fly if we don't already have one;
              // use tagging function if we have one
              if ( ctrl.tagging.fct !== undefined && typeof item === 'string' ) {
                item = ctrl.tagging.fct(ctrl.search);
                if (!item) return;
              // if item type is 'string', apply the tagging label
              } else if ( typeof item === 'string' ) {
                // trim the trailing space
                item = item.replace(ctrl.taggingLabel,'').trim();
              }
            }
          }
          // search ctrl.selected for dupes potentially caused by tagging and return early if found
          if ( ctrl.selected && angular.isArray(ctrl.selected) && ctrl.selected.filter( function (selection) { return angular.equals(selection, item); }).length > 0 ) {
            ctrl.close(skipFocusser);
            return;
          }
        }

        $scope.$broadcast('uis:select', item);

        var locals = {};
        locals[ctrl.parserResult.itemName] = item;

        $timeout(function(){
          ctrl.onSelectCallback($scope, {
            $item: item,
            $model: ctrl.parserResult.modelMapper($scope, locals)
          });
        });

        if (ctrl.closeOnSelect) {
          ctrl.close(skipFocusser);
        }
        if ($event && $event.type === 'click') {
          ctrl.clickTriggeredSelect = true;
        }
      }
    }
  };

  // Closes the dropdown
  ctrl.close = function(skipFocusser) {
    if (!ctrl.open) return;
    if (ctrl.ngModel && ctrl.ngModel.$setTouched) ctrl.ngModel.$setTouched();
    _resetSearchInput();
    ctrl.open = false;

    $scope.$broadcast('uis:close', skipFocusser);

  };

  ctrl.setFocus = function(){
    if (!ctrl.focus) ctrl.focusInput[0].focus();
  };

  ctrl.clear = function($event) {
    ctrl.select(undefined);
    $event.stopPropagation();
    $timeout(function() {
      ctrl.focusser[0].focus();
    }, 0, false);
  };

  // Toggle dropdown
  ctrl.toggle = function(e) {
    if (ctrl.open) {
      ctrl.close();
      e.preventDefault();
      e.stopPropagation();
    } else {
      ctrl.activate();
    }
  };

  ctrl.isLocked = function(itemScope, itemIndex) {
      var isLocked, item = ctrl.selected[itemIndex];

      if (item && !angular.isUndefined(ctrl.lockChoiceExpression)) {
          isLocked = !!(itemScope.$eval(ctrl.lockChoiceExpression)); // force the boolean value
          item._uiSelectChoiceLocked = isLocked; // store this for later reference
      }

      return isLocked;
  };

  var sizeWatch = null;
  ctrl.sizeSearchInput = function() {

    var input = ctrl.searchInput[0],
        container = ctrl.searchInput.parent().parent()[0],
        calculateContainerWidth = function() {
          // Return the container width only if the search input is visible
          return container.clientWidth * !!input.offsetParent;
        },
        updateIfVisible = function(containerWidth) {
          if (containerWidth === 0) {
            return false;
          }
          var inputWidth = containerWidth - input.offsetLeft - 10;
          if (inputWidth < 50) inputWidth = containerWidth;
          ctrl.searchInput.css('width', inputWidth+'px');
          return true;
        };

    ctrl.searchInput.css('width', '10px');
    $timeout(function() { //Give tags time to render correctly
      if (sizeWatch === null && !updateIfVisible(calculateContainerWidth())) {
        sizeWatch = $scope.$watch(calculateContainerWidth, function(containerWidth) {
          if (updateIfVisible(containerWidth)) {
            sizeWatch();
            sizeWatch = null;
          }
        });
      }
    });
  };

  function _handleDropDownSelection(key) {
    var processed = true;
    switch (key) {
      case KEY.DOWN:
        if (!ctrl.open && ctrl.multiple) ctrl.activate(false, true); //In case its the search input in 'multiple' mode
        else if (ctrl.activeIndex < ctrl.items.length - 1) { ctrl.activeIndex++; }
        break;
      case KEY.UP:
        if (!ctrl.open && ctrl.multiple) ctrl.activate(false, true); //In case its the search input in 'multiple' mode
        else if (ctrl.activeIndex > 0 || (ctrl.search.length === 0 && ctrl.tagging.isActivated && ctrl.activeIndex > -1)) { ctrl.activeIndex--; }
        break;
      case KEY.TAB:
        if (!ctrl.multiple || ctrl.open) ctrl.select(ctrl.items[ctrl.activeIndex], true);
        break;
      case KEY.ENTER:
        if(ctrl.open && (ctrl.tagging.isActivated || ctrl.activeIndex >= 0)){
          ctrl.select(ctrl.items[ctrl.activeIndex]); // Make sure at least one dropdown item is highlighted before adding if not in tagging mode
        } else {
          ctrl.activate(false, true); //In case its the search input in 'multiple' mode
        }
        break;
      case KEY.ESC:
        ctrl.close();
        break;
      default:
        processed = false;
    }
    return processed;
  }

  // Bind to keyboard shortcuts
  ctrl.searchInput.on('keydown', function(e) {

    var key = e.which;

    // if(~[KEY.ESC,KEY.TAB].indexOf(key)){
    //   //TODO: SEGURO?
    //   ctrl.close();
    // }

    $scope.$apply(function() {

      var tagged = false;

      if (ctrl.items.length > 0 || ctrl.tagging.isActivated) {
        _handleDropDownSelection(key);
        if ( ctrl.taggingTokens.isActivated ) {
          for (var i = 0; i < ctrl.taggingTokens.tokens.length; i++) {
            if ( ctrl.taggingTokens.tokens[i] === KEY.MAP[e.keyCode] ) {
              // make sure there is a new value to push via tagging
              if ( ctrl.search.length > 0 ) {
                tagged = true;
              }
            }
          }
          if ( tagged ) {
            $timeout(function() {
              ctrl.searchInput.triggerHandler('tagged');
              var newItem = ctrl.search.replace(KEY.MAP[e.keyCode],'').trim();
              if ( ctrl.tagging.fct ) {
                newItem = ctrl.tagging.fct( newItem );
              }
              if (newItem) ctrl.select(newItem, true);
            });
          }
        }
      }

    });

    if(KEY.isVerticalMovement(key) && ctrl.items.length > 0){
      _ensureHighlightVisible();
    }

    if (key === KEY.ENTER || key === KEY.ESC) {
      e.preventDefault();
      e.stopPropagation();
    }

  });

  // If tagging try to split by tokens and add items
  ctrl.searchInput.on('paste', function (e) {
    var data = e.originalEvent.clipboardData.getData('text/plain');
    if (data && data.length > 0 && ctrl.taggingTokens.isActivated) {
      // split by first token only
      var separator = KEY.toSeparator(ctrl.taggingTokens.tokens[0]);
      var items = data.split(separator);
      if (items && items.length > 0) {
        var oldsearch = ctrl.search;
        angular.forEach(items, function (item) {
          ctrl.search = item;
          ctrl.select(item, true);
        });
        ctrl.search = oldsearch;
        e.preventDefault();
        e.stopPropagation();
      }
    }
  });

  ctrl.searchInput.on('tagged', function() {
    $timeout(function() {
      _resetSearchInput();
    });
  });

  // See https://github.com/ivaynberg/select2/blob/3.4.6/select2.js#L1431
  function _ensureHighlightVisible() {
    var container = $element.querySelectorAll('.ui-select-choices-content');
    var choices = container.querySelectorAll('.ui-select-choices-row');
    if (choices.length < 1) {
      throw uiSelectMinErr('choices', "Expected multiple .ui-select-choices-row but got '{0}'.", choices.length);
    }

    if (ctrl.activeIndex < 0) {
      return;
    }

    var highlighted = choices[ctrl.activeIndex];
    var posY = highlighted.offsetTop + highlighted.clientHeight - container[0].scrollTop;
    var height = container[0].offsetHeight;

    if (posY > height) {
      container[0].scrollTop += posY - height;
    } else if (posY < highlighted.clientHeight) {
      if (ctrl.isGrouped && ctrl.activeIndex === 0)
        container[0].scrollTop = 0; //To make group header visible when going all the way up
      else
        container[0].scrollTop -= highlighted.clientHeight - posY;
    }
  }

  $scope.$on('$destroy', function() {
    ctrl.searchInput.off('keyup keydown tagged blur paste');
  });

}]);

// Array findIndex polyfill (source: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/findIndex#Polyfill)
if (!Array.prototype.findIndex) {
  Array.prototype.findIndex = function(predicate) {
    if (this === null) {
      throw new TypeError('Array.prototype.findIndex called on null or undefined');
    }
    if (typeof predicate !== 'function') {
      throw new TypeError('predicate must be a function');
    }
    var list = Object(this);
    var length = list.length >>> 0;
    var thisArg = arguments[1];
    var value;

    for (var i = 0; i < length; i++) {
      value = list[i];
      if (predicate.call(thisArg, value, i, list)) {
        return i;
      }
    }
    return -1;
  };
}

uis.directive('uiSelect',
  ['$document', 'uiSelectConfig', 'uiSelectMinErr', 'uisOffset', '$compile', '$parse', '$timeout',
  function($document, uiSelectConfig, uiSelectMinErr, uisOffset, $compile, $parse, $timeout) {

  return {
    restrict: 'EA',
    templateUrl: function(tElement, tAttrs) {
      var theme = tAttrs.theme || uiSelectConfig.theme;
      return theme + (angular.isDefined(tAttrs.multiple) ? '/select-multiple.tpl.html' : '/select.tpl.html');
    },
    replace: true,
    transclude: true,
    require: ['uiSelect', '^ngModel'],
    scope: true,

    controller: 'uiSelectCtrl',
    controllerAs: '$select',
    compile: function(tElement, tAttrs) {

      //Multiple or Single depending if multiple attribute presence
      if (angular.isDefined(tAttrs.multiple))
        tElement.append('<ui-select-multiple/>').removeAttr('multiple');
      else
        tElement.append('<ui-select-single/>');

      if (tAttrs.inputId)
        tElement.querySelectorAll('input.ui-select-search')[0].id = tAttrs.inputId;

      return function(scope, element, attrs, ctrls, transcludeFn) {

        var $select = ctrls[0];
        var ngModel = ctrls[1];

        $select.generatedId = uiSelectConfig.generateId();
        $select.baseTitle = attrs.title || 'Select box';
        $select.focusserTitle = $select.baseTitle + ' focus';
        $select.focusserId = 'focusser-' + $select.generatedId;

        $select.closeOnSelect = function() {
          if (angular.isDefined(attrs.closeOnSelect)) {
            return $parse(attrs.closeOnSelect)();
          } else {
            return uiSelectConfig.closeOnSelect;
          }
        }();

        $select.onSelectCallback = $parse(attrs.onSelect);
        $select.onRemoveCallback = $parse(attrs.onRemove);

        if(attrs.loading){
          scope.$watch(function(){
            return scope.$eval(attrs.loading);
          }, function(value){
              $select.loading = value;
          });
        }

        //Limit the number of selections allowed
        $select.limit = (angular.isDefined(attrs.limit)) ? parseInt(attrs.limit, 10) : undefined;

        //Set reference to ngModel from uiSelectCtrl
        $select.ngModel = ngModel;

        $select.choiceGrouped = function(group){
          return $select.isGrouped && group && group.name;
        };

        if(attrs.tabindex){
          attrs.$observe('tabindex', function(value) {
            $select.focusInput.attr('tabindex', value);
            element.removeAttr('tabindex');
          });
        }

        scope.$watch('searchEnabled', function() {
            var searchEnabled = scope.$eval(attrs.searchEnabled);
            $select.searchEnabled = searchEnabled !== undefined ? searchEnabled : uiSelectConfig.searchEnabled;
        });

        scope.$watch('sortable', function() {
            var sortable = scope.$eval(attrs.sortable);
            $select.sortable = sortable !== undefined ? sortable : uiSelectConfig.sortable;
        });

        attrs.$observe('disabled', function() {
          // No need to use $eval() (thanks to ng-disabled) since we already get a boolean instead of a string
          $select.disabled = attrs.disabled !== undefined ? attrs.disabled : false;
        });

        attrs.$observe('resetSearchInput', function() {
          // $eval() is needed otherwise we get a string instead of a boolean
          var resetSearchInput = scope.$eval(attrs.resetSearchInput);
          $select.resetSearchInput = resetSearchInput !== undefined ? resetSearchInput : true;
        });

        attrs.$observe('tagging', function() {
          if(attrs.tagging !== undefined)
          {
            // $eval() is needed otherwise we get a string instead of a boolean
            var taggingEval = scope.$eval(attrs.tagging);
            $select.tagging = {isActivated: true, fct: taggingEval !== true ? taggingEval : undefined};
          }
          else
          {
            $select.tagging = {isActivated: false, fct: undefined};
          }
        });

        attrs.$observe('taggingLabel', function() {
          if(attrs.tagging !== undefined )
          {
            // check eval for FALSE, in this case, we disable the labels
            // associated with tagging
            if ( attrs.taggingLabel === 'false' ) {
              $select.taggingLabel = false;
            }
            else
            {
              $select.taggingLabel = attrs.taggingLabel !== undefined ? attrs.taggingLabel : '(new)';
            }
          }
        });

        attrs.$observe('taggingTokens', function() {
          if (attrs.tagging !== undefined) {
            var tokens = attrs.taggingTokens !== undefined ? attrs.taggingTokens.split('|') : [',','ENTER'];
            $select.taggingTokens = {isActivated: true, tokens: tokens };
          }
        });

        //Automatically gets focus when loaded
        if (angular.isDefined(attrs.autofocus)){
          $timeout(function(){
            $select.setFocus();
          });
        }

        //Gets focus based on scope event name (e.g. focus-on='SomeEventName')
        if (angular.isDefined(attrs.focusOn)){
          scope.$on(attrs.focusOn, function() {
              $timeout(function(){
                $select.setFocus();
              });
          });
        }

        function onDocumentClick(e) {
          if (!$select.open) return; //Skip it if dropdown is close

          var contains = false;

          if (window.jQuery) {
            // Firefox 3.6 does not support element.contains()
            // See Node.contains https://developer.mozilla.org/en-US/docs/Web/API/Node.contains
            contains = window.jQuery.contains(element[0], e.target);
          } else {
            contains = element[0].contains(e.target);
          }

          if (!contains && !$select.clickTriggeredSelect) {
            //Will lose focus only with certain targets
            var focusableControls = ['input','button','textarea','select'];
            var targetController = angular.element(e.target).controller('uiSelect'); //To check if target is other ui-select
            var skipFocusser = targetController && targetController !== $select; //To check if target is other ui-select
            if (!skipFocusser) skipFocusser =  ~focusableControls.indexOf(e.target.tagName.toLowerCase()); //Check if target is input, button or textarea
            $select.close(skipFocusser);
            scope.$digest();
          }
          $select.clickTriggeredSelect = false;
        }

        // See Click everywhere but here event http://stackoverflow.com/questions/12931369
        $document.on('click', onDocumentClick);

        scope.$on('$destroy', function() {
          $document.off('click', onDocumentClick);
        });

        // Move transcluded elements to their correct position in main template
        transcludeFn(scope, function(clone) {
          // See Transclude in AngularJS http://blog.omkarpatil.com/2012/11/transclude-in-angularjs.html

          // One day jqLite will be replaced by jQuery and we will be able to write:
          // var transcludedElement = clone.filter('.my-class')
          // instead of creating a hackish DOM element:
          var transcluded = angular.element('<div>').append(clone);

          var transcludedMatch = transcluded.querySelectorAll('.ui-select-match');
          transcludedMatch.removeAttr('ui-select-match'); //To avoid loop in case directive as attr
          transcludedMatch.removeAttr('data-ui-select-match'); // Properly handle HTML5 data-attributes
          if (transcludedMatch.length !== 1) {
            throw uiSelectMinErr('transcluded', "Expected 1 .ui-select-match but got '{0}'.", transcludedMatch.length);
          }
          element.querySelectorAll('.ui-select-match').replaceWith(transcludedMatch);

          var transcludedChoices = transcluded.querySelectorAll('.ui-select-choices');
          transcludedChoices.removeAttr('ui-select-choices'); //To avoid loop in case directive as attr
          transcludedChoices.removeAttr('data-ui-select-choices'); // Properly handle HTML5 data-attributes
          if (transcludedChoices.length !== 1) {
            throw uiSelectMinErr('transcluded', "Expected 1 .ui-select-choices but got '{0}'.", transcludedChoices.length);
          }
          element.querySelectorAll('.ui-select-choices').replaceWith(transcludedChoices);
        });

        // Support for appending the select field to the body when its open
        var appendToBody = scope.$eval(attrs.appendToBody);
        if (appendToBody !== undefined ? appendToBody : uiSelectConfig.appendToBody) {
          scope.$watch('$select.open', function(isOpen) {
            if (isOpen) {
              positionDropdown();
            } else {
              resetDropdown();
            }
          });

          // Move the dropdown back to its original location when the scope is destroyed. Otherwise
          // it might stick around when the user routes away or the select field is otherwise removed
          scope.$on('$destroy', function() {
            resetDropdown();
          });
        }

        // Hold on to a reference to the .ui-select-container element for appendToBody support
        var placeholder = null,
            originalWidth = '';

        function positionDropdown() {
          // Remember the absolute position of the element
          var offset = uisOffset(element);

          // Clone the element into a placeholder element to take its original place in the DOM
          placeholder = angular.element('<div class="ui-select-placeholder"></div>');
          placeholder[0].style.width = offset.width + 'px';
          placeholder[0].style.height = offset.height + 'px';
          element.after(placeholder);

          // Remember the original value of the element width inline style, so it can be restored
          // when the dropdown is closed
          originalWidth = element[0].style.width;

          // Now move the actual dropdown element to the end of the body
          $document.find('body').append(element);

          element[0].style.position = 'absolute';
          element[0].style.left = offset.left + 'px';
          element[0].style.top = offset.top + 'px';
          element[0].style.width = offset.width + 'px';
        }

        function resetDropdown() {
          if (placeholder === null) {
            // The dropdown has not actually been display yet, so there's nothing to reset
            return;
          }

          // Move the dropdown element back to its original location in the DOM
          placeholder.replaceWith(element);
          placeholder = null;

          element[0].style.position = '';
          element[0].style.left = '';
          element[0].style.top = '';
          element[0].style.width = originalWidth;
        }

        // Hold on to a reference to the .ui-select-dropdown element for direction support.
        var dropdown = null,
            directionUpClassName = 'direction-up';

        // Support changing the direction of the dropdown if there isn't enough space to render it.
        scope.$watch('$select.open', function() {

          if ($select.dropdownPosition === 'auto' || $select.dropdownPosition === 'up'){
            scope.calculateDropdownPos();
          }

        });

        var setDropdownPosUp = function(offset, offsetDropdown){

          offset = offset || uisOffset(element);
          offsetDropdown = offsetDropdown || uisOffset(dropdown);

          dropdown[0].style.position = 'absolute';
          dropdown[0].style.top = (offsetDropdown.height * -1) + 'px';
          element.addClass(directionUpClassName);

        };

        var setDropdownPosDown = function(offset, offsetDropdown){

          element.removeClass(directionUpClassName);

          offset = offset || uisOffset(element);
          offsetDropdown = offsetDropdown || uisOffset(dropdown);

          dropdown[0].style.position = '';
          dropdown[0].style.top = '';

        };

        scope.calculateDropdownPos = function(){

          if ($select.open) {
            dropdown = angular.element(element).querySelectorAll('.ui-select-dropdown');
            if (dropdown.length === 0) {
              return;
            }

            // Hide the dropdown so there is no flicker until $timeout is done executing.
            dropdown[0].style.opacity = 0;

            // Delay positioning the dropdown until all choices have been added so its height is correct.
            $timeout(function(){

              if ($select.dropdownPosition === 'up'){
                  //Go UP
                  setDropdownPosUp();

              }else{ //AUTO

                element.removeClass(directionUpClassName);

                var offset = uisOffset(element);
                var offsetDropdown = uisOffset(dropdown);

                //https://code.google.com/p/chromium/issues/detail?id=342307#c4
                var scrollTop = $document[0].documentElement.scrollTop || $document[0].body.scrollTop; //To make it cross browser (blink, webkit, IE, Firefox).

                // Determine if the direction of the dropdown needs to be changed.
                if (offset.top + offset.height + offsetDropdown.height > scrollTop + $document[0].documentElement.clientHeight) {
                  //Go UP
                  setDropdownPosUp(offset, offsetDropdown);
                }else{
                  //Go DOWN
                  setDropdownPosDown(offset, offsetDropdown);
                }

              }

              // Display the dropdown once it has been positioned.
              dropdown[0].style.opacity = 1;
            });
          } else {
              if (dropdown === null || dropdown.length === 0) {
                return;
              }

              // Reset the position of the dropdown.
              dropdown[0].style.position = '';
              dropdown[0].style.top = '';
              element.removeClass(directionUpClassName);
          }
        };
      };
    }
  };
}]);

uis.directive('uiSelectMatch', ['uiSelectConfig', function(uiSelectConfig) {
  return {
    restrict: 'EA',
    require: '^uiSelect',
    replace: true,
    transclude: true,
    templateUrl: function(tElement) {
      // Gets theme attribute from parent (ui-select)
      var theme = tElement.parent().attr('theme') || uiSelectConfig.theme;
      var multi = tElement.parent().attr('multiple');
      return theme + (multi ? '/match-multiple.tpl.html' : '/match.tpl.html');
    },
    link: function(scope, element, attrs, $select) {
      $select.lockChoiceExpression = attrs.uiLockChoice;
      attrs.$observe('placeholder', function(placeholder) {
        $select.placeholder = placeholder !== undefined ? placeholder : uiSelectConfig.placeholder;
      });

      function setAllowClear(allow) {
        $select.allowClear = (angular.isDefined(allow)) ? (allow === '') ? true : (allow.toLowerCase() === 'true') : false;
      }

      attrs.$observe('allowClear', setAllowClear);
      setAllowClear(attrs.allowClear);

      if($select.multiple){
        $select.sizeSearchInput();
      }

    }
  };
}]);

uis.directive('uiSelectMultiple', ['uiSelectMinErr','$timeout', function(uiSelectMinErr, $timeout) {
  return {
    restrict: 'EA',
    require: ['^uiSelect', '^ngModel'],

    controller: ['$scope','$timeout', function($scope, $timeout){

      var ctrl = this,
          $select = $scope.$select,
          ngModel;

      //Wait for link fn to inject it 
      $scope.$evalAsync(function(){ ngModel = $scope.ngModel; });

      ctrl.activeMatchIndex = -1;

      ctrl.updateModel = function(){
        ngModel.$setViewValue(Date.now()); //Set timestamp as a unique string to force changes
        ctrl.refreshComponent();
      };

      ctrl.refreshComponent = function(){
        //Remove already selected items
        //e.g. When user clicks on a selection, the selected array changes and 
        //the dropdown should remove that item
        $select.refreshItems();
        $select.sizeSearchInput();
      };

      // Remove item from multiple select
      ctrl.removeChoice = function(index){

        var removedChoice = $select.selected[index];

        // if the choice is locked, can't remove it
        if(removedChoice._uiSelectChoiceLocked) return;

        var locals = {};
        locals[$select.parserResult.itemName] = removedChoice;

        $select.selected.splice(index, 1);
        ctrl.activeMatchIndex = -1;
        $select.sizeSearchInput();

        // Give some time for scope propagation.
        $timeout(function(){
          $select.onRemoveCallback($scope, {
            $item: removedChoice,
            $model: $select.parserResult.modelMapper($scope, locals)
          });
        });

        ctrl.updateModel();

      };

      ctrl.getPlaceholder = function(){
        //Refactor single?
        if($select.selected && $select.selected.length) return;
        return $select.placeholder;
      };


    }],
    controllerAs: '$selectMultiple',

    link: function(scope, element, attrs, ctrls) {

      var $select = ctrls[0];
      var ngModel = scope.ngModel = ctrls[1];
      var $selectMultiple = scope.$selectMultiple;

      //$select.selected = raw selected objects (ignoring any property binding)

      $select.multiple = true;
      $select.removeSelected = true;

      //Input that will handle focus
      $select.focusInput = $select.searchInput;

      //From view --> model
      ngModel.$parsers.unshift(function () {
        var locals = {},
            result,
            resultMultiple = [];
        for (var j = $select.selected.length - 1; j >= 0; j--) {
          locals = {};
          locals[$select.parserResult.itemName] = $select.selected[j];
          result = $select.parserResult.modelMapper(scope, locals);
          resultMultiple.unshift(result);
        }
        return resultMultiple;
      });      // From model --> view
      ngModel.$formatters.unshift(function (inputValue) {
          var data = $select.parserResult.source(scope, { $select: { search: '' } }), //Overwrite $search
              locals = {},
              result;
          if (!data) return inputValue;
          var resultMultiple = [];

          var alreadyExistsInResultsFn = function (candidate) {
              var trackBy = $select.parserResult.trackByExp;

              for (var i = 0; i < resultMultiple.length; i++) {
                  var current = resultMultiple[i];

                  if (trackBy) {
                      var matches = /\.(.+)/.exec($select.parserResult.trackByExp);
                      if (matches && matches.length > 0 && current[matches[1]] !== undefined && current[matches[1]] == candidate[matches[1]]) {
                          return true;
                      }
                  }
                  else {
                      if (angular.equals(current, candidate)) {
                          return true;
                      }
                  }
              }

              return false;
          };

          var addToResultsSafeFn = function (candidate) {

              if (!alreadyExistsInResultsFn(candidate)) {
                  resultMultiple.unshift(candidate);
                  return true;
              }

              return false;
          };

          var checkFnMultiple = function (list, value) {
              if (!list || !list.length) return;
              for (var p = list.length - 1; p >= 0; p--) {
                  locals[$select.parserResult.itemName] = list[p];
                  result = $select.parserResult.modelMapper(scope, locals);
                  if ($select.parserResult.trackByExp) {
                      var matches = /\.(.+)/.exec($select.parserResult.trackByExp);
                      if (matches && matches.length > 0 && result[matches[1]] !== undefined && result[matches[1]] === value[matches[1]]) {
                          if (addToResultsSafeFn(list[p])) {
                              return true;
                          }
                      }
                  }
                  if (angular.equals(result, value)) {
                      if (addToResultsSafeFn(list[p])) {
                          return true;
                      }
                  }
              }
              return false;
          };
          if (!inputValue) return resultMultiple; //If ngModel was undefined
          for (var k = inputValue.length - 1; k >= 0; k--) {
              //Check model array of currently selected items 
              if (!checkFnMultiple($select.selected, inputValue[k])) {
                  //Check model array of all items available
                  if (!checkFnMultiple(data, inputValue[k])) {
                      //If not found on previous lists, just add it directly to resultMultiple
                      addToResultsSafeFn(inputValue[k]);
                  }
              }
          }
          return resultMultiple;
      });
      
      //Watch for external model changes 
      scope.$watchCollection(function(){ return ngModel.$modelValue; }, function(newValue, oldValue) {
        if (oldValue != newValue){
          ngModel.$modelValue = null; //Force scope model value and ngModel value to be out of sync to re-run formatters
          $selectMultiple.refreshComponent();
        }
      });

      ngModel.$render = function() {
        // Make sure that model value is array
        if(!angular.isArray(ngModel.$viewValue)){
          // Have tolerance for null or undefined values
          if(angular.isUndefined(ngModel.$viewValue) || ngModel.$viewValue === null){
            $select.selected = [];
          } else {
            throw uiSelectMinErr('multiarr', "Expected model value to be array but got '{0}'", ngModel.$viewValue);
          }
        }
        $select.selected = ngModel.$viewValue;
        scope.$evalAsync(); //To force $digest
      };

      scope.$on('uis:select', function (event, item) {
        if($select.selected.length >= $select.limit) {
          return;
        }
        $select.selected.push(item);
        $selectMultiple.updateModel();
      });

      scope.$on('uis:activate', function () {
        $selectMultiple.activeMatchIndex = -1;
      });

      scope.$watch('$select.disabled', function(newValue, oldValue) {
        // As the search input field may now become visible, it may be necessary to recompute its size
        if (oldValue && !newValue) $select.sizeSearchInput();
      });

      $select.searchInput.on('keydown', function(e) {
        var key = e.which;
        scope.$apply(function() {
          var processed = false;
          // var tagged = false; //Checkme
          if(KEY.isHorizontalMovement(key)){
            processed = _handleMatchSelection(key);
          }
          if (processed  && key != KEY.TAB) {
            //TODO Check si el tab selecciona aun correctamente
            //Crear test
            e.preventDefault();
            e.stopPropagation();
          }
        });
      });
      function _getCaretPosition(el) {
        if(angular.isNumber(el.selectionStart)) return el.selectionStart;
        // selectionStart is not supported in IE8 and we don't want hacky workarounds so we compromise
        else return el.value.length;
      }
      // Handles selected options in "multiple" mode
      function _handleMatchSelection(key){
        var caretPosition = _getCaretPosition($select.searchInput[0]),
            length = $select.selected.length,
            // none  = -1,
            first = 0,
            last  = length-1,
            curr  = $selectMultiple.activeMatchIndex,
            next  = $selectMultiple.activeMatchIndex+1,
            prev  = $selectMultiple.activeMatchIndex-1,
            newIndex = curr;

        if(caretPosition > 0 || ($select.search.length && key == KEY.RIGHT)) return false;

        $select.close();

        function getNewActiveMatchIndex(){
          switch(key){
            case KEY.LEFT:
              // Select previous/first item
              if(~$selectMultiple.activeMatchIndex) return prev;
              // Select last item
              else return last;
              break;
            case KEY.RIGHT:
              // Open drop-down
              if(!~$selectMultiple.activeMatchIndex || curr === last){
                $select.activate();
                return false;
              }
              // Select next/last item
              else return next;
              break;
            case KEY.BACKSPACE:
              // Remove selected item and select previous/first
              if(~$selectMultiple.activeMatchIndex){
                $selectMultiple.removeChoice(curr);
                return prev;
              }
              // Select last item
              else return last;
              break;
            case KEY.DELETE:
              // Remove selected item and select next item
              if(~$selectMultiple.activeMatchIndex){
                $selectMultiple.removeChoice($selectMultiple.activeMatchIndex);
                return curr;
              }
              else return false;
          }
        }

        newIndex = getNewActiveMatchIndex();

        if(!$select.selected.length || newIndex === false) $selectMultiple.activeMatchIndex = -1;
        else $selectMultiple.activeMatchIndex = Math.min(last,Math.max(first,newIndex));

        return true;
      }

      $select.searchInput.on('keyup', function(e) {

        if ( ! KEY.isVerticalMovement(e.which) ) {
          scope.$evalAsync( function () {
            $select.activeIndex = $select.taggingLabel === false ? -1 : 0;
          });
        }
        // Push a "create new" item into array if there is a search string
        if ( $select.tagging.isActivated && $select.search.length > 0 ) {

          // return early with these keys
          if (e.which === KEY.TAB || KEY.isControl(e) || KEY.isFunctionKey(e) || e.which === KEY.ESC || KEY.isVerticalMovement(e.which) ) {
            return;
          }
          // always reset the activeIndex to the first item when tagging
          $select.activeIndex = $select.taggingLabel === false ? -1 : 0;
          // taggingLabel === false bypasses all of this
          if ($select.taggingLabel === false) return;

          var items = angular.copy( $select.items );
          var stashArr = angular.copy( $select.items );
          var newItem;
          var item;
          var hasTag = false;
          var dupeIndex = -1;
          var tagItems;
          var tagItem;

          // case for object tagging via transform `$select.tagging.fct` function
          if ( $select.tagging.fct !== undefined) {
            tagItems = $select.$filter('filter')(items,{'isTag': true});
            if ( tagItems.length > 0 ) {
              tagItem = tagItems[0];
            }
            // remove the first element, if it has the `isTag` prop we generate a new one with each keyup, shaving the previous
            if ( items.length > 0 && tagItem ) {
              hasTag = true;
              items = items.slice(1,items.length);
              stashArr = stashArr.slice(1,stashArr.length);
            }
            newItem = $select.tagging.fct($select.search);
            newItem.isTag = true;
            // verify the the tag doesn't match the value of an existing item
            if ( stashArr.filter( function (origItem) { return angular.equals( origItem, $select.tagging.fct($select.search) ); } ).length > 0 ) {
              return;
            }
            newItem.isTag = true;
          // handle newItem string and stripping dupes in tagging string context
          } else {
            // find any tagging items already in the $select.items array and store them
            tagItems = $select.$filter('filter')(items,function (item) {
              return item.match($select.taggingLabel);
            });
            if ( tagItems.length > 0 ) {
              tagItem = tagItems[0];
            }
            item = items[0];
            // remove existing tag item if found (should only ever be one tag item)
            if ( item !== undefined && items.length > 0 && tagItem ) {
              hasTag = true;
              items = items.slice(1,items.length);
              stashArr = stashArr.slice(1,stashArr.length);
            }
            newItem = $select.search+' '+$select.taggingLabel;
            if ( _findApproxDupe($select.selected, $select.search) > -1 ) {
              return;
            }
            // verify the the tag doesn't match the value of an existing item from
            // the searched data set or the items already selected
            if ( _findCaseInsensitiveDupe(stashArr.concat($select.selected)) ) {
              // if there is a tag from prev iteration, strip it / queue the change
              // and return early
              if ( hasTag ) {
                items = stashArr;
                scope.$evalAsync( function () {
                  $select.activeIndex = 0;
                  $select.items = items;
                });
              }
              return;
            }
            if ( _findCaseInsensitiveDupe(stashArr) ) {
              // if there is a tag from prev iteration, strip it
              if ( hasTag ) {
                $select.items = stashArr.slice(1,stashArr.length);
              }
              return;
            }
          }
          if ( hasTag ) dupeIndex = _findApproxDupe($select.selected, newItem);
          // dupe found, shave the first item
          if ( dupeIndex > -1 ) {
            items = items.slice(dupeIndex+1,items.length-1);
          } else {
            items = [];
            items.push(newItem);
            items = items.concat(stashArr);
          }
          scope.$evalAsync( function () {
            $select.activeIndex = 0;
            $select.items = items;
          });
        }
      });
      function _findCaseInsensitiveDupe(arr) {
        if ( arr === undefined || $select.search === undefined ) {
          return false;
        }
        var hasDupe = arr.filter( function (origItem) {
          if ( $select.search.toUpperCase() === undefined || origItem === undefined ) {
            return false;
          }
          return origItem.toUpperCase() === $select.search.toUpperCase();
        }).length > 0;

        return hasDupe;
      }
      function _findApproxDupe(haystack, needle) {
        var dupeIndex = -1;
        if(angular.isArray(haystack)) {
          var tempArr = angular.copy(haystack);
          for (var i = 0; i <tempArr.length; i++) {
            // handle the simple string version of tagging
            if ( $select.tagging.fct === undefined ) {
              // search the array for the match
              if ( tempArr[i]+' '+$select.taggingLabel === needle ) {
              dupeIndex = i;
              }
            // handle the object tagging implementation
            } else {
              var mockObj = tempArr[i];
              if (angular.isObject(mockObj)) {
                mockObj.isTag = true;
              }
              if ( angular.equals(mockObj, needle) ) {
                dupeIndex = i;
              }
            }
          }
        }
        return dupeIndex;
      }

      $select.searchInput.on('blur', function() {
        $timeout(function() {
          $selectMultiple.activeMatchIndex = -1;
        });
      });

    }
  };
}]);

uis.directive('uiSelectSingle', ['$timeout','$compile', function($timeout, $compile) {
  return {
    restrict: 'EA',
    require: ['^uiSelect', '^ngModel'],
    link: function(scope, element, attrs, ctrls) {

      var $select = ctrls[0];
      var ngModel = ctrls[1];

      //From view --> model
      ngModel.$parsers.unshift(function (inputValue) {
        var locals = {},
            result;
        locals[$select.parserResult.itemName] = inputValue;
        result = $select.parserResult.modelMapper(scope, locals);
        return result;
      });

      //From model --> view
      ngModel.$formatters.unshift(function (inputValue) {
        var data = $select.parserResult.source (scope, { $select : {search:''}}), //Overwrite $search
            locals = {},
            result;
        if (data){
          var checkFnSingle = function(d){
            locals[$select.parserResult.itemName] = d;
            result = $select.parserResult.modelMapper(scope, locals);
            return result == inputValue;
          };
          //If possible pass same object stored in $select.selected
          if ($select.selected && checkFnSingle($select.selected)) {
            return $select.selected;
          }
          for (var i = data.length - 1; i >= 0; i--) {
            if (checkFnSingle(data[i])) return data[i];
          }
        }
        return inputValue;
      });

      //Update viewValue if model change
      scope.$watch('$select.selected', function(newValue) {
        if (ngModel.$viewValue !== newValue) {
          ngModel.$setViewValue(newValue);
        }
      });

      ngModel.$render = function() {
        $select.selected = ngModel.$viewValue;
      };

      scope.$on('uis:select', function (event, item) {
        $select.selected = item;
      });

      scope.$on('uis:close', function (event, skipFocusser) {
        $timeout(function(){
          $select.focusser.prop('disabled', false);
          if (!skipFocusser) $select.focusser[0].focus();
        },0,false);
      });

      scope.$on('uis:activate', function () {
        focusser.prop('disabled', true); //Will reactivate it on .close()
      });

      //Idea from: https://github.com/ivaynberg/select2/blob/79b5bf6db918d7560bdd959109b7bcfb47edaf43/select2.js#L1954
      var focusser = angular.element("<input ng-disabled='$select.disabled' class='ui-select-focusser ui-select-offscreen' type='text' id='{{ $select.focusserId }}' aria-label='{{ $select.focusserTitle }}' aria-haspopup='true' role='button' />");
      $compile(focusser)(scope);
      $select.focusser = focusser;

      //Input that will handle focus
      $select.focusInput = focusser;

      element.parent().append(focusser);
      focusser.bind("focus", function(){
        scope.$evalAsync(function(){
          $select.focus = true;
        });
      });
      focusser.bind("blur", function(){
        scope.$evalAsync(function(){
          $select.focus = false;
        });
      });
      focusser.bind("keydown", function(e){

        if (e.which === KEY.BACKSPACE) {
          e.preventDefault();
          e.stopPropagation();
          $select.select(undefined);
          scope.$apply();
          return;
        }

        if (e.which === KEY.TAB || KEY.isControl(e) || KEY.isFunctionKey(e) || e.which === KEY.ESC) {
          return;
        }

        if (e.which == KEY.DOWN  || e.which == KEY.UP || e.which == KEY.ENTER || e.which == KEY.SPACE){
          e.preventDefault();
          e.stopPropagation();
          $select.activate();
        }

        scope.$digest();
      });

      focusser.bind("keyup input", function(e){

        if (e.which === KEY.TAB || KEY.isControl(e) || KEY.isFunctionKey(e) || e.which === KEY.ESC || e.which == KEY.ENTER || e.which === KEY.BACKSPACE) {
          return;
        }

        $select.activate(focusser.val()); //User pressed some regular key, so we pass it to the search input
        focusser.val('');
        scope.$digest();

      });


    }
  };
}]);
// Make multiple matches sortable
uis.directive('uiSelectSort', ['$timeout', 'uiSelectConfig', 'uiSelectMinErr', function($timeout, uiSelectConfig, uiSelectMinErr) {
  return {
    require: '^uiSelect',
    link: function(scope, element, attrs, $select) {
      if (scope[attrs.uiSelectSort] === null) {
        throw uiSelectMinErr('sort', "Expected a list to sort");
      }

      var options = angular.extend({
          axis: 'horizontal'
        },
        scope.$eval(attrs.uiSelectSortOptions));

      var axis = options.axis,
        draggingClassName = 'dragging',
        droppingClassName = 'dropping',
        droppingBeforeClassName = 'dropping-before',
        droppingAfterClassName = 'dropping-after';

      scope.$watch(function(){
        return $select.sortable;
      }, function(n){
        if (n) {
          element.attr('draggable', true);
        } else {
          element.removeAttr('draggable');
        }
      });

      element.on('dragstart', function(e) {
        element.addClass(draggingClassName);

        (e.dataTransfer || e.originalEvent.dataTransfer).setData('text/plain', scope.$index);
      });

      element.on('dragend', function() {
        element.removeClass(draggingClassName);
      });

      var move = function(from, to) {
        /*jshint validthis: true */
        this.splice(to, 0, this.splice(from, 1)[0]);
      };

      var dragOverHandler = function(e) {
        e.preventDefault();

        var offset = axis === 'vertical' ? e.offsetY || e.layerY || (e.originalEvent ? e.originalEvent.offsetY : 0) : e.offsetX || e.layerX || (e.originalEvent ? e.originalEvent.offsetX : 0);

        if (offset < (this[axis === 'vertical' ? 'offsetHeight' : 'offsetWidth'] / 2)) {
          element.removeClass(droppingAfterClassName);
          element.addClass(droppingBeforeClassName);

        } else {
          element.removeClass(droppingBeforeClassName);
          element.addClass(droppingAfterClassName);
        }
      };

      var dropTimeout;

      var dropHandler = function(e) {
        e.preventDefault();

        var droppedItemIndex = parseInt((e.dataTransfer || e.originalEvent.dataTransfer).getData('text/plain'), 10);

        // prevent event firing multiple times in firefox
        $timeout.cancel(dropTimeout);
        dropTimeout = $timeout(function() {
          _dropHandler(droppedItemIndex);
        }, 20);
      };

      var _dropHandler = function(droppedItemIndex) {
        var theList = scope.$eval(attrs.uiSelectSort),
          itemToMove = theList[droppedItemIndex],
          newIndex = null;

        if (element.hasClass(droppingBeforeClassName)) {
          if (droppedItemIndex < scope.$index) {
            newIndex = scope.$index - 1;
          } else {
            newIndex = scope.$index;
          }
        } else {
          if (droppedItemIndex < scope.$index) {
            newIndex = scope.$index;
          } else {
            newIndex = scope.$index + 1;
          }
        }

        move.apply(theList, [droppedItemIndex, newIndex]);

        scope.$apply(function() {
          scope.$emit('uiSelectSort:change', {
            array: theList,
            item: itemToMove,
            from: droppedItemIndex,
            to: newIndex
          });
        });

        element.removeClass(droppingClassName);
        element.removeClass(droppingBeforeClassName);
        element.removeClass(droppingAfterClassName);

        element.off('drop', dropHandler);
      };

      element.on('dragenter', function() {
        if (element.hasClass(draggingClassName)) {
          return;
        }

        element.addClass(droppingClassName);

        element.on('dragover', dragOverHandler);
        element.on('drop', dropHandler);
      });

      element.on('dragleave', function(e) {
        if (e.target != element) {
          return;
        }
        element.removeClass(droppingClassName);
        element.removeClass(droppingBeforeClassName);
        element.removeClass(droppingAfterClassName);

        element.off('dragover', dragOverHandler);
        element.off('drop', dropHandler);
      });
    }
  };
}]);

/**
 * Parses "repeat" attribute.
 *
 * Taken from AngularJS ngRepeat source code
 * See https://github.com/angular/angular.js/blob/v1.2.15/src/ng/directive/ngRepeat.js#L211
 *
 * Original discussion about parsing "repeat" attribute instead of fully relying on ng-repeat:
 * https://github.com/angular-ui/ui-select/commit/5dd63ad#commitcomment-5504697
 */

uis.service('uisRepeatParser', ['uiSelectMinErr','$parse', function(uiSelectMinErr, $parse) {
  var self = this;

  /**
   * Example:
   * expression = "address in addresses | filter: {street: $select.search} track by $index"
   * itemName = "address",
   * source = "addresses | filter: {street: $select.search}",
   * trackByExp = "$index",
   */
  self.parse = function(expression) {


    var match;
    var isObjectCollection = /\(\s*([\$\w][\$\w]*)\s*,\s*([\$\w][\$\w]*)\s*\)/.test(expression);
    // If an array is used as collection

    // if (isObjectCollection){
      //00000000000000000000000000000111111111000000000000000222222222222220033333333333333333333330000444444444444444444000000000000000556666660000077777777777755000000000000000000000088888880000000
    match = expression.match(/^\s*(?:([\s\S]+?)\s+as\s+)?(?:([\$\w][\$\w]*)|(?:\(\s*([\$\w][\$\w]*)\s*,\s*([\$\w][\$\w]*)\s*\)))\s+in\s+(([\w\.]+)?\s*(|\s*[\s\S]+?))?(?:\s+track\s+by\s+([\s\S]+?))?\s*$/);      

    // 1 Alias
    // 2 Item
    // 3 Key on (key,value)
    // 4 Value on (key,value)
    // 5 Collection expresion (only used when using an array collection)
    // 6 Object that will be converted to Array when using (key,value) syntax
    // 7 Filters that will be applied to #6 when using (key,value) syntax
    // 8 Track by

    if (!match) {
      throw uiSelectMinErr('iexp', "Expected expression in form of '_item_ in _collection_[ track by _id_]' but got '{0}'.",
              expression);
    }
    if (!match[6] && isObjectCollection) {
      throw uiSelectMinErr('iexp', "Expected expression in form of '_item_ as (_key_, _item_) in _ObjCollection_ [ track by _id_]' but got '{0}'.",
              expression);
    }

    return {
      itemName: match[4] || match[2], // (lhs) Left-hand side,
      keyName: match[3], //for (key, value) syntax
      source: $parse(!match[3] ? match[5] : match[6]),
      sourceName: match[6],
      filters: match[7],
      trackByExp: match[8],
      modelMapper: $parse(match[1] || match[4] || match[2]),
      repeatExpression: function (grouped) {
        var expression = this.itemName + ' in ' + (grouped ? '$group.items' : '$select.items');
        if (this.trackByExp) {
          expression += ' track by ' + this.trackByExp;
        }
        return expression;
      } 
    };

  };

  self.getGroupNgRepeatExpression = function() {
    return '$group in $select.groups';
  };

}]);

}());
angular.module("ui.select").run(["$templateCache", function($templateCache) {$templateCache.put("bootstrap/choices.tpl.html","<ul class=\"ui-select-choices ui-select-choices-content ui-select-dropdown dropdown-menu\" role=\"listbox\" ng-show=\"$select.items.length > 0\"><li class=\"ui-select-choices-group\" id=\"ui-select-choices-{{ $select.generatedId }}\"><div class=\"divider\" ng-show=\"$select.isGrouped && $index > 0\"></div><div ng-show=\"$select.isGrouped\" class=\"ui-select-choices-group-label dropdown-header\" ng-bind=\"$group.name\"></div><div id=\"ui-select-choices-row-{{ $select.generatedId }}-{{$index}}\" class=\"ui-select-choices-row\" ng-class=\"{active: $select.isActive(this), disabled: $select.isDisabled(this)}\" role=\"option\"><a href=\"\" class=\"ui-select-choices-row-inner\"></a></div></li></ul>");
$templateCache.put("bootstrap/match-multiple.tpl.html","<span class=\"ui-select-match\"><span ng-repeat=\"$item in $select.selected\"><span class=\"ui-select-match-item btn btn-default btn-xs\" tabindex=\"-1\" type=\"button\" ng-disabled=\"$select.disabled\" ng-click=\"$selectMultiple.activeMatchIndex = $index;\" ng-class=\"{\'btn-primary\':$selectMultiple.activeMatchIndex === $index, \'select-locked\':$select.isLocked(this, $index)}\" ui-select-sort=\"$select.selected\"><span class=\"close ui-select-match-close\" ng-hide=\"$select.disabled\" ng-click=\"$selectMultiple.removeChoice($index)\">&nbsp;&times;</span> <span uis-transclude-append=\"\"></span></span></span></span>");
$templateCache.put("bootstrap/match.tpl.html","<div class=\"ui-select-match\" ng-hide=\"$select.open\" ng-disabled=\"$select.disabled\" ng-class=\"{\'btn-default-focus\':$select.focus}\"><span tabindex=\"-1\" class=\"btn btn-default form-control ui-select-toggle\" aria-label=\"{{ $select.baseTitle }} activate\" ng-disabled=\"$select.disabled\" ng-click=\"$select.activate()\" style=\"outline: 0;\"><span ng-show=\"$select.isEmpty()\" class=\"ui-select-placeholder text-muted\">{{$select.placeholder}}</span> <span ng-hide=\"$select.isEmpty()\" class=\"ui-select-match-text pull-left\" ng-class=\"{\'ui-select-allow-clear\': $select.allowClear && !$select.isEmpty()}\" ng-transclude=\"\"></span> <i class=\"caret pull-right\" ng-click=\"$select.toggle($event)\"></i> <a ng-show=\"$select.allowClear && !$select.isEmpty()\" aria-label=\"{{ $select.baseTitle }} clear\" style=\"margin-right: 10px\" ng-click=\"$select.clear($event)\" class=\"btn btn-xs btn-link pull-right\"><i class=\"glyphicon glyphicon-remove\" aria-hidden=\"true\"></i></a></span></div>");
$templateCache.put("bootstrap/select-multiple.tpl.html","<div class=\"ui-select-container ui-select-multiple ui-select-bootstrap dropdown form-control\" ng-class=\"{open: $select.open}\"><div><div class=\"ui-select-match\"></div><input type=\"text\" autocomplete=\"false\" autocorrect=\"off\" autocapitalize=\"off\" spellcheck=\"false\" class=\"ui-select-search input-xs\" placeholder=\"{{$selectMultiple.getPlaceholder()}}\" ng-disabled=\"$select.disabled\" ng-hide=\"$select.disabled\" ng-click=\"$select.activate()\" ng-model=\"$select.search\" role=\"combobox\" aria-label=\"{{ $select.baseTitle }}\" ondrop=\"return false;\"></div><div class=\"ui-select-choices\"></div></div>");
$templateCache.put("bootstrap/select.tpl.html","<div class=\"ui-select-container ui-select-bootstrap dropdown\" ng-class=\"{open: $select.open}\"><div class=\"ui-select-match\"></div><input type=\"text\" autocomplete=\"false\" tabindex=\"-1\" aria-expanded=\"true\" aria-label=\"{{ $select.baseTitle }}\" aria-owns=\"ui-select-choices-{{ $select.generatedId }}\" aria-activedescendant=\"ui-select-choices-row-{{ $select.generatedId }}-{{ $select.activeIndex }}\" class=\"form-control ui-select-search\" placeholder=\"{{$select.placeholder}}\" ng-model=\"$select.search\" ng-show=\"$select.searchEnabled && $select.open\"><div class=\"ui-select-choices\"></div></div>");
$templateCache.put("select2/choices.tpl.html","<ul class=\"ui-select-choices ui-select-choices-content select2-results\"><li class=\"ui-select-choices-group\" ng-class=\"{\'select2-result-with-children\': $select.choiceGrouped($group) }\"><div ng-show=\"$select.choiceGrouped($group)\" class=\"ui-select-choices-group-label select2-result-label\" ng-bind=\"$group.name\"></div><ul role=\"listbox\" id=\"ui-select-choices-{{ $select.generatedId }}\" ng-class=\"{\'select2-result-sub\': $select.choiceGrouped($group), \'select2-result-single\': !$select.choiceGrouped($group) }\"><li role=\"option\" id=\"ui-select-choices-row-{{ $select.generatedId }}-{{$index}}\" class=\"ui-select-choices-row\" ng-class=\"{\'select2-highlighted\': $select.isActive(this), \'select2-disabled\': $select.isDisabled(this)}\"><div class=\"select2-result-label ui-select-choices-row-inner\"></div></li></ul></li></ul>");
$templateCache.put("select2/match-multiple.tpl.html","<span class=\"ui-select-match\"><li class=\"ui-select-match-item select2-search-choice\" ng-repeat=\"$item in $select.selected\" ng-class=\"{\'select2-search-choice-focus\':$selectMultiple.activeMatchIndex === $index, \'select2-locked\':$select.isLocked(this, $index)}\" ui-select-sort=\"$select.selected\"><span uis-transclude-append=\"\"></span> <a href=\"javascript:;\" class=\"ui-select-match-close select2-search-choice-close\" ng-click=\"$selectMultiple.removeChoice($index)\" tabindex=\"-1\"></a></li></span>");
$templateCache.put("select2/match.tpl.html","<a class=\"select2-choice ui-select-match\" ng-class=\"{\'select2-default\': $select.isEmpty()}\" ng-click=\"$select.toggle($event)\" aria-label=\"{{ $select.baseTitle }} select\"><span ng-show=\"$select.isEmpty()\" class=\"select2-chosen\">{{$select.placeholder}}</span> <span ng-hide=\"$select.isEmpty()\" class=\"select2-chosen\" ng-transclude=\"\"></span> <abbr ng-if=\"$select.allowClear && !$select.isEmpty()\" class=\"select2-search-choice-close\" ng-click=\"$select.clear($event)\"></abbr> <span class=\"select2-arrow ui-select-toggle\"><b></b></span></a>");
$templateCache.put("select2/select-multiple.tpl.html","<div class=\"ui-select-container ui-select-multiple select2 select2-container select2-container-multi\" ng-class=\"{\'select2-container-active select2-dropdown-open open\': $select.open, \'select2-container-disabled\': $select.disabled}\"><ul class=\"select2-choices\"><span class=\"ui-select-match\"></span><li class=\"select2-search-field\"><input type=\"text\" autocomplete=\"false\" autocorrect=\"off\" autocapitalize=\"off\" spellcheck=\"false\" role=\"combobox\" aria-expanded=\"true\" aria-owns=\"ui-select-choices-{{ $select.generatedId }}\" aria-label=\"{{ $select.baseTitle }}\" aria-activedescendant=\"ui-select-choices-row-{{ $select.generatedId }}-{{ $select.activeIndex }}\" class=\"select2-input ui-select-search\" placeholder=\"{{$selectMultiple.getPlaceholder()}}\" ng-disabled=\"$select.disabled\" ng-hide=\"$select.disabled\" ng-model=\"$select.search\" ng-click=\"$select.activate()\" style=\"width: 34px;\" ondrop=\"return false;\"></li></ul><div class=\"ui-select-dropdown select2-drop select2-with-searchbox select2-drop-active\" ng-class=\"{\'select2-display-none\': !$select.open}\"><div class=\"ui-select-choices\"></div></div></div>");
$templateCache.put("select2/select.tpl.html","<div class=\"ui-select-container select2 select2-container\" ng-class=\"{\'select2-container-active select2-dropdown-open open\': $select.open, \'select2-container-disabled\': $select.disabled, \'select2-container-active\': $select.focus, \'select2-allowclear\': $select.allowClear && !$select.isEmpty()}\"><div class=\"ui-select-match\"></div><div class=\"ui-select-dropdown select2-drop select2-with-searchbox select2-drop-active\" ng-class=\"{\'select2-display-none\': !$select.open}\"><div class=\"select2-search\" ng-show=\"$select.searchEnabled\"><input type=\"text\" autocomplete=\"false\" autocorrect=\"false\" autocapitalize=\"off\" spellcheck=\"false\" role=\"combobox\" aria-expanded=\"true\" aria-owns=\"ui-select-choices-{{ $select.generatedId }}\" aria-label=\"{{ $select.baseTitle }}\" aria-activedescendant=\"ui-select-choices-row-{{ $select.generatedId }}-{{ $select.activeIndex }}\" class=\"ui-select-search select2-input\" ng-model=\"$select.search\"></div><div class=\"ui-select-choices\"></div></div></div>");
$templateCache.put("selectize/choices.tpl.html","<div ng-show=\"$select.open\" class=\"ui-select-choices ui-select-dropdown selectize-dropdown single\"><div class=\"ui-select-choices-content selectize-dropdown-content\"><div class=\"ui-select-choices-group optgroup\" role=\"listbox\"><div ng-show=\"$select.isGrouped\" class=\"ui-select-choices-group-label optgroup-header\" ng-bind=\"$group.name\"></div><div role=\"option\" class=\"ui-select-choices-row\" ng-class=\"{active: $select.isActive(this), disabled: $select.isDisabled(this)}\"><div class=\"option ui-select-choices-row-inner\" data-selectable=\"\"></div></div></div></div></div>");
$templateCache.put("selectize/match.tpl.html","<div ng-hide=\"($select.open || $select.isEmpty())\" class=\"ui-select-match\" ng-transclude=\"\"></div>");
$templateCache.put("selectize/select.tpl.html","<div class=\"ui-select-container selectize-control single\" ng-class=\"{\'open\': $select.open}\"><div class=\"row\"><div class=\"col-md-11\"><div class=\"selectize-input\" ng-class=\"{\'focus\': $select.open, \'disabled\': $select.disabled, \'selectize-focus\' : $select.focus}\" ng-click=\"$select.open && !$select.searchEnabled ? $select.toggle($event) : $select.activate()\"><div class=\"ui-select-match\"></div><input type=\"text\" autocomplete=\"false\" tabindex=\"-1\" class=\"ui-select-search ui-select-toggle\" ng-click=\"$select.toggle($event)\" placeholder=\"{{$select.placeholder}}\" ng-model=\"$select.search\" ng-hide=\"!$select.searchEnabled || ($select.selected && !$select.open)\" ng-disabled=\"$select.disabled\" aria-label=\"{{ $select.baseTitle }}\"></div></div><div class=\"col-md-1\">{{$select.loading}} <img ng-if=\"$select.loading\" width=\"30\" src=\"data:image/gif;base64,R0lGODlhlACUAPeAAEuW34q76prE7Wem5GWl5G6q5Wqo5Xyz6FCZ4E6Y4Hmx53Cr5lme4pTA7Fqf4nKt5lyg4kyX30qW31Sb4abL71id4eDt+YK26Y2960yX4LHS8anM8Nnp+K7Q8fz9/k2X4MHa9I++60+Y4EqV38Xd9Xiw58rg9rjV8nav51Wc4aTK72up5WOk41Ka4NPl94a56p7G7rXU8oS46fn7/v3+/lKa4ZfC7GGj41+i4+zz+/r8/n606PD2/HWv5t7r+bzX80yW32Ci44O36c7i9mCj412h41Sc4cPc9NHk9+Tv+r7Z86vO8Obw+rvX89bn9/T4/ejy+6LI7lac4Z/H7lie4e71/H+16FGZ4JC/6/7+/l6h4/X5/Vug4uz0/FGa4KPJ79Xm+Nzq+LnW88/i9snf9vb6/efx+7PT8ePu+ZXC7czh9vL3/azO8PH3/Mje9ery+9zr+ZzF7uLt+s/j97fU8v7+/7TS8qDH7srg9fj7/evz/Njn9+fw+vj6/vr7/f///////wAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAACH/C05FVFNDQVBFMi4wAwEAAAAh/wtYTVAgRGF0YVhNUDw/eHBhY2tldCBiZWdpbj0i77u/IiBpZD0iVzVNME1wQ2VoaUh6cmVTek5UY3prYzlkIj8+IDx4OnhtcG1ldGEgeG1sbnM6eD0iYWRvYmU6bnM6bWV0YS8iIHg6eG1wdGs9IkFkb2JlIFhNUCBDb3JlIDUuNi1jMDY3IDc5LjE1Nzc0NywgMjAxNS8wMy8zMC0yMzo0MDo0MiAgICAgICAgIj4gPHJkZjpSREYgeG1sbnM6cmRmPSJodHRwOi8vd3d3LnczLm9yZy8xOTk5LzAyLzIyLXJkZi1zeW50YXgtbnMjIj4gPHJkZjpEZXNjcmlwdGlvbiByZGY6YWJvdXQ9IiIgeG1sbnM6eG1wPSJodHRwOi8vbnMuYWRvYmUuY29tL3hhcC8xLjAvIiB4bWxuczp4bXBNTT0iaHR0cDovL25zLmFkb2JlLmNvbS94YXAvMS4wL21tLyIgeG1sbnM6c3RSZWY9Imh0dHA6Ly9ucy5hZG9iZS5jb20veGFwLzEuMC9zVHlwZS9SZXNvdXJjZVJlZiMiIHhtcDpDcmVhdG9yVG9vbD0iQWRvYmUgUGhvdG9zaG9wIENDIDIwMTUgKE1hY2ludG9zaCkiIHhtcE1NOkluc3RhbmNlSUQ9InhtcC5paWQ6NzQ4RDczNjVBRDM0MTFFNTg0ODlGMDgwQkJDRjVCMDAiIHhtcE1NOkRvY3VtZW50SUQ9InhtcC5kaWQ6NzQ4RDczNjZBRDM0MTFFNTg0ODlGMDgwQkJDRjVCMDAiPiA8eG1wTU06RGVyaXZlZEZyb20gc3RSZWY6aW5zdGFuY2VJRD0ieG1wLmlpZDo3NDhENzM2M0FEMzQxMUU1ODQ4OUYwODBCQkNGNUIwMCIgc3RSZWY6ZG9jdW1lbnRJRD0ieG1wLmRpZDo3NDhENzM2NEFEMzQxMUU1ODQ4OUYwODBCQkNGNUIwMCIvPiA8L3JkZjpEZXNjcmlwdGlvbj4gPC9yZGY6UkRGPiA8L3g6eG1wbWV0YT4gPD94cGFja2V0IGVuZD0iciI/PgH//v38+/r5+Pf29fTz8vHw7+7t7Ovq6ejn5uXk4+Lh4N/e3dzb2tnY19bV1NPS0dDPzs3My8rJyMfGxcTDwsHAv769vLu6ubi3trW0s7KxsK+urayrqqmop6alpKOioaCfnp2cm5qZmJeWlZSTkpGQj46NjIuKiYiHhoWEg4KBgH9+fXx7enl4d3Z1dHNycXBvbm1sa2ppaGdmZWRjYmFgX15dXFtaWVhXVlVUU1JRUE9OTUxLSklIR0ZFRENCQUA/Pj08Ozo5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\"></div></div><div class=\"ui-select-choices\"></div></div>");}]);