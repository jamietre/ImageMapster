$(function () {
  // a cross reference of area names to text for each area's tooltip
  const xref = {
      carrots: '<b>Carrots</b> are delicious and may turn your skin orange!',
      asparagus:
        "<b>Asparagus</b> is one of the first vegetables of the spring. Being a dark green, it's great for you, and has interesting side effects.",
      squash:
        '<b>Squash</b> is a winter vegetable, and not eaten raw too much. Is that really squash?',
      redpepper:
        "<b>Red peppers</b> are actually the same as green peppers, they've just been left on the vine longer. Delicious when fire-roasted.",
      yellowpepper:
        'Similar to red peppers, <b>yellow peppers</b> are sometimes sweeter.',
      celery:
        '<b>Celery</b> is a fascinating vegetable. Being mostly water, it actually takes your body more calories to process it than it provides.',
      cucumbers: '<b>Cucumbers</b> are cool.',
      broccoli:
        '<b>Broccoli</b> is like a forest of goodness in your mouth. And very good for you. Eat lots of broccoli!',
      dip: "Everything here is good for you but this one. <b>Don't be a dip!</b>"
    },
    defaultDipTooltip =
      "I know you want the dip. But it's loaded with saturated fat, just skip it and enjoy as many delicious, crisp vegetables as you can eat.",
    $image = $('#vegetables-img'),
    $selectionsDetails = $('#selections-vegetable-details'),
    $selectionsInstructions = $('#selections-instructions'),
    opts = {
      enableAutoResizeSupport: true,
      autoResize: true,
      fillOpacity: 0.4,
      fillColor: 'd42e16',
      strokeColor: '3320FF',
      strokeOpacity: 0.8,
      strokeWidth: 4,
      stroke: true,
      isSelectable: true,
      singleSelect: true,
      mapKey: 'data-name',
      listKey: 'data-name',
      onClick: function (data) {
        var newToolTip = defaultDipTooltip;
        if (data.selected) {
          $selectionsDetails.html(xref[data.key]);
          $selectionsInstructions.hide();
          $selectionsDetails.show();
        } else {
          $selectionsDetails.hide();
          $selectionsInstructions.show();
        }
        if (data.key === 'asparagus') {
          newToolTip =
            "OK. I know I have come down on the dip before, but let's be real. Raw asparagus without any of that " +
            'delicious ranch and onion dressing slathered all over it is not so good.';
        }
        $image.mapster('set_options', {
          areas: [
            {
              key: 'dip',
              toolTip: newToolTip
            }
          ]
        });
      },
      showToolTip: true,
      toolTipClose: ['tooltip-click', 'area-click', 'image-mouseout'],
      areas: [
        {
          key: 'redpepper',
          fillColor: 'ffffff'
        },
        {
          key: 'yellowpepper',
          fillColor: '000000'
        },
        {
          key: 'carrots',
          fillColor: '000000'
        },
        {
          key: 'dip',
          toolTip: defaultDipTooltip
        },
        {
          key: 'asparagus',
          strokeColor: 'FFFFFF'
        }
      ]
    };

  $image.mapster(opts);
});
