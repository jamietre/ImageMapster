
$(document).ready(function () {

    var $jointlist, $joint_map, default_options, mapsterConfigured;


    //$toolTipList = $('#hidden_divs');
    $jointlist = $('#jointlist');
    $joint_map = $('#body_hand_foot_image');

    function getFullCheckBoxID(item) {

        var checkBoxName = item.attr('name');
        var checkBoxId = item.attr('id');
        var rheumType;

        if (checkBoxId.indexOf("_swol") >= 1) {
            rheumType = "_swol"
        } else if (checkBoxId.indexOf("_tend") >= 1) {
            rheumType = "_tend"
        }
        return checkBoxName + rheumType;
    }

    function setMapsterArea(selectedInputs, name) {
        selected = selectedInputs.length > 0;
        $joint_map.mapster('set', selected, name);
    }

    function doCheckBoxAreaAction(chkBox, checked) {
        var fullID = getFullCheckBoxID(chkBox);
        var checkBoxName = chkBox.attr('name');
        var listCheckbox = $jointlist.find('#jl_' + fullID);
        listCheckbox.attr('checked', checked);

        setMapsterArea($('#' + checkBoxName + '_divID').find('input:checked'), checkBoxName);
    }

    function setToolTipCheckBoxEvent(data) {
        // Get the two checkboxes within the 
        var checkBoxes = data.toolTip.find('input');

        checkBoxes.each(function () {

            var span = $(this).parent().find('span');

            span.unbind('click').bind('click', function (e) {
                var chk = $(this).parent().find('input');
                var isChecked = chk.is(':checked');
                // want to do opposite of what the check box is
                // set the checkbox
                chk.attr('checked', !isChecked);
                doCheckBoxAreaAction(chk, !isChecked);
            });

            var ttName = $(this).attr('name');

            var checkBoxId = getFullCheckBoxID($(this));
            var listCheckbox = $jointlist.find('#jl_' + checkBoxId);

            if (listCheckbox.attr('name') == ttName) {
                $(this).attr('checked', listCheckbox.attr('checked'));
            }

            // return the list to mapster so it can bind to it
            return $(this).unbind('click').click(function (e) {
                var selected = $(this).is(':checked');
                doCheckBoxAreaAction($(this), selected);
            });
        });
    }

    function doJointListClickEvent(chkBox, selected) {
        // Find the tooltip inside the mapster canvas
        var tooltipListCheckbox = $('#mapster_wrap_0').find('#tt_' + getFullCheckBoxID(chkBox));
        tooltipListCheckbox.attr('checked', selected);

        var checkBoxName = chkBox.attr('name');
        var realName = checkBoxName;
        var rheumType;

        if (checkBoxName.indexOf("_swol") >= 1) {
            realName = checkBoxName.substring(0, checkBoxName.indexOf("_swol"));
            rheumType = "_swol"
        } else if (checkBoxName.indexOf("_tend") >= 1) {
            realName = checkBoxName.substring(0, checkBoxName.indexOf("_tend"));
            rheumType = "_tend"
        }

        setMapsterArea(chkBox.parent().find('input:checked'), realName);
    }


    function addCheckBoxes() {
        $jointlist.find('span').unbind('click').bind('click', function (e) {

            var chk = null;
            if ($(this).text() == "T") {
                chk = $(this).parent().children('#jl_' + $(this).attr('key') + '_tend');
            } else if ($(this).text() == "S") {
                chk = $(this).parent().children('#jl_' + $(this).attr('key') + '_swol');
            }


            var isChecked = chk.is(':checked');
            // want to do opposite of what the check box is
            // set the checkbox
            chk.attr('checked', !isChecked);

            doJointListClickEvent(chk, !isChecked);
        });


        return $jointlist.find('input:checkbox').unbind('click').click(function (e) {
            var selected = $(this).is(':checked');
            doJointListClickEvent($(this), selected);

        });
    }

    addCheckBoxes();

    function toolTipCloseOptions() {
        return ['area-mouseout', 'tooltip-click'];
    }

    function getToolTip(jointName) {
        return $('#' + jointName + '_divID');
    }

    function buildAreas() {
        var items = $('#jointMap').find('area');
        var areaArray = [];

        items.each(function () {

            var areaName = $(this).attr('joint');
            var fullName = $(this).attr('full');
            areaArray.push({ key: areaName, toolTip: buildToolTipArea(areaName, fullName) });
        });
        return areaArray;
    }

    function buildToolTipArea(name, fullName) {
        return $('<div id="' + name + '_divID"><div>' + fullName + '</div><div>' +
            '<div><input id="tt_' + name + '_swol" type="checkbox" name="' + name + '" /><span class="sel" key="' + name + '">Swelling</span></div>' +
            '<div><input id="tt_' + name + '_tend" type="checkbox" name="' + name + '" /><span class="sel" key="' + name + '">Tender</span></div></div></div>');
    }

    default_options =
        {
            fillOpacity: 0.5,
            render_highlight: {
                fillColor: '22ff00',
                stroke: true
            },
            render_select: {
                fillColor: 'ff000c',
                stroke: false
            },

            fadeInterval: 50,
            isSelectable: false,
            singleSelect: false,
            mapKey: 'joint',
            mapValue: 'full',
            listKey: 'name',
            listSelectedAttribute: 'checked',
            sortList: false,
            showToolTip: true,
            toolTipClose: toolTipCloseOptions,
            onShowToolTip: setToolTipCheckBoxEvent,
            areas: buildAreas()
        };


    $joint_map.mapster(default_options);

    function loadPreselectedItems() {
        // Only find the elements that are of type input and checked
        var items = $jointlist.find("input:checked");
        var selectedKeys = [];

        // iterate through each of the items (Java/C# equivalent of foreach, very nifty)
        items.each(function () {
            var curItem = $(this);
            //divItem = curItem.closest('div').css("font-weight", "bold");
            selectedKeys.push(curItem.attr('name'));
        });

        // pass the selected keys as arguments
        $joint_map.mapster('set', true, selectedKeys.join(','));
    }

    loadPreselectedItems();
});