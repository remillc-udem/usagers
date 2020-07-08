'use strict';

$(function () {

  // Prefillable function

  var params = new URLSearchParams(location.search),
    $streetAddressField = $('#streetAddress'),
    $streetAddressLineFields = $('[data-field="streetAddress"]'),
    $errorDialog = $('#error-dialog'),
    $errorDialogBody = $errorDialog.find('.modal-body');

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
      })
      .fail(function (jqXhr) {
        var err = jqXhr.responseJSON,
          msg = '<p>Une erreur innatendue nous empêche de traiter votre demande. Veuillez communiquer avec nous via <a href="mailto:unequestion@bib.umontreal.ca">unequestion@bib.umontreal.ca</a>.</p>';
        if (err && 'status' in err && err.status === '500' && 'detail' in err && err.detail === 'Unable to create user. Please contact Customer Support at support@oclc.org.') {
          // Duplicate email error
          msg = "<p>L'adresse courriel est déjà utilisée. Veuillez vérifier votre adresse courriel.</p>";
        } else {
          if ('urn:mace:oclc.org:eidm:schema:persona:messages:20180305' in jqXhr.responseJSON) {
            var messages = jqXhr.responseJSON["urn:mace:oclc.org:eidm:schema:persona:messages:20180305"].messages;
            for (var i = 0; i < messages.length; i++) {
              console.error(messages[i])
            }
          } else {
            console.log(arguments);
          }
        }
        $errorDialogBody.html(msg);
        $errorDialog.modal()
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
  })

  /** 
   * Initialisation
   * 
   */

  toggleSection('formulaire')
});