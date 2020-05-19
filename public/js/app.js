'use strict';

$(function () {

  // Prefillable function

  var params = new URLSearchParams(location.search),
    $streetAddressField = $('#streetAddress'),
    $streetAddressLineFields = $('[data-field="streetAddress"]'),
    $errorDialog = $('#error-dialog');

  function toggleSection(section) {
    $('.section').attr('hidden', true);
    $('#section-' + section).removeAttr('hidden');
  }

  function fillAddress() {
    var values = $.map($streetAddressLineFields.filter(function () {
      return $(this).val() !== '';
    }), function (item) {
      return $(item).val();
    })

    $streetAddressField.val(values.join('\n'))
  }

  $streetAddressLineFields.on('change', fillAddress)

  $('.prefillable').each(function () {
    const param = this.name;
    if (params.has(param)) {
      $(this).val(params.get(param))
      if (param === "streetAddress") {
        var streetAddressLines = params.get(param).split(/[\n\r]/g);

        if (streetAddressLines && streetAddressLines.length > 0) {
          $('#streetAddressLine1').val(streetAddressLines[0])
        }

        if (streetAddressLines.length > 1) {
          $('#streetAddressLine2').val(streetAddressLines[1])
        }
      }
    }
  })


  // Ajout d'une astérisque (*) au libellé des champs obligatoires
  $('[required]').each(function () {
    const id = this.id;
    $('[for="' + id + '"]').each(function () {
      $(this).append('<r> *</r>');
    })
  })

  // Champs pré-remplissables
  // var props = [
  //   'givenName',
  //   'familyName',
  //   'email',
  //   'streetAddress',
  //   'locality',
  //   'region',
  //   'country',
  //   'postalCode',
  //   'externalId',
  //   'borrowerCategory',
  //   'homeBranch',
  // ];

  // props = jQuery.makeArray($('.prefillable').map(function (i, node) {
  //   return node.name;
  // }))

  // $('#props').html('<code>' + props.join('</code>, <code>') + '</code>')

  /** 
   * Submit
   * 
   */
  $('#registration-form').on('submit', function (e) {
    e.preventDefault();

    var formData = new FormData(this),
      data = {},
      serviceUrl = this.action,
      $btnSubmitContainer = $('.btn-submit--container');

    $btnSubmitContainer.find('.btn').attr('disabled', true);
    $btnSubmitContainer.find('i').attr('hidden', true);
    $btnSubmitContainer.find('.spinner').removeAttr('hidden');

    for (var p of formData) {
      data[p[0]] = formData.get(p[0])
    }

    $.post(serviceUrl, data)
      .done(function (data) {
        toggleSection('confirmation')
        console.log(data)
        $('#data').text(JSON.stringify(data, null, 2))
      })
      .fail(function (jqXhr) {
        console.log(arguments)
        var err = jqXhr.responseJSON;
        if (err && 'status' in err && err.status === '500' && 'detail' in err && err.detail === 'Unable to create user. Please contact Customer Support at support@oclc.org.') {
          // Duplicate email error
          $errorDialog.modal()
        } else {
          toggleSection('confirmation')
          // $('#data').text(JSON.stringify(jqXhr.responseJSON, null, 2));
        }
      })
      .always(function () {
        $btnSubmitContainer.find('.btn').removeAttr('disabled');
        $btnSubmitContainer.find('i').removeAttr('hidden');
        $btnSubmitContainer.find('.spinner').attr('hidden', true);
      })
  })

  $('.btn-go-section-formulaire').on('click', function (e) {
    e.preventDefault();
    toggleSection('formulaire');
    $('#data').text('');
  })

  /** 
   * Initialisation
   * 
   */

  toggleSection('formulaire')
});