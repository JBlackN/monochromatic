(function() {

  var algorithm = null;

  var searchColor = document.getElementById('search-color');
  searchColor.addEventListener('input', function() {
    var searchColor = document.getElementById('search-color');
    document.getElementById('header-colored').style.color = searchColor.value;
    document.getElementById('progress-value').style.backgroundColor = searchColor.value;
  });

  var controlsAdvanced = document.getElementById('controls-advanced');
  var controlsAdvToggle = document.getElementById('controls-advanced-toggle');
  var controlsAdvToggled = false;
  controlsAdvToggle.addEventListener('mouseenter', function() {
    var searchColor = document.getElementById('search-color');
    controlsAdvToggle.style.fontSize = '1.45em';
    if (!controlsAdvToggled)
      controlsAdvToggle.style.color = searchColor.value;
  });
  controlsAdvToggle.addEventListener('mouseleave', function() {
    controlsAdvToggle.style.fontSize = '1.33em';
    if (!controlsAdvToggled)
      controlsAdvToggle.style.color = '#000';
  });
  controlsAdvToggle.addEventListener('click', function() {
    if (controlsAdvToggled) {
      controlsAdvanced.style.display = 'none';
      controlsAdvToggle.style.color = '#000';
      controlsAdvToggled = false;
    }
    else {
      controlsAdvanced.style.display = 'block';
      controlsAdvToggle.style.color = searchColor.value;
      controlsAdvToggled = true;
    }
  });

  var searchCount = document.getElementById('search-count');
  var searchCountDisplay = document.getElementById('search-count-display');
  searchCount.addEventListener('input', function() {
    searchCountDisplay.innerText = '(' + searchCount.value + ')';
  });
  var kMeansK = document.getElementById('search-km-k');
  var kMeansKDisplay = document.getElementById('search-km-k-display');
  kMeansK.addEventListener('input', function() {
    kMeansKDisplay.innerText = '(' + kMeansK.value + ')';
  });
  var thrT = document.getElementById('search-thr');
  var thrTDisplay = document.getElementById('search-thr-display');
  thrT.addEventListener('input', function() {
    var thrTMeaning = null;
    if (thrT.value <=1)
      thrTMeaning = 'normally invisible difference.';
    else if (thrT.value <= 2)
      thrTMeaning = 'very small difference, only obvious to a trained eye.';
    else if (thrT.value <= 3.5)
      thrTMeaning = 'medium difference, also obvious to an untrained eye.';
    else if (thrT.value <= 5)
      thrTMeaning = 'obvious difference.';
    else
      thrTMeaning = 'very obvious difference.';
    thrTDisplay.innerText = '(' + thrT.value + ' ~ ' + thrTMeaning + ')';
  });
  var covEffect = document.getElementById('search-cov-effect');
  var covEffectDisplay = document.getElementById('search-cov-effect-display');
  covEffect.addEventListener('input', function() {
    covEffectDisplay.innerText = '(' + parseInt(parseFloat(covEffect.value) * 100) + '%)';
  });

  var searchSubmit = document.getElementById('search-submit');
  searchSubmit.addEventListener('click', search);

  var itemsProcessed = 0;
  var itemsTotal = 0;

  function search() {
    var searchText = document.getElementById('search-text').value;

    var algorithms = document.getElementsByName('search-algorithm');
    for (var i = 0; i < algorithms.length; i++) {
      if (algorithms[i].checked) algorithm = {
        type: algorithms[i].value,
        params: []
      };
    }
    if (algorithm.type == 'tc' || algorithm.type == 'kmtc')
      algorithm.params.push(['threshold', document.getElementById('search-thr').value]);
    if (algorithm.type != 'tc') {
      algorithm.params.push(['k', document.getElementById('search-km-k').value]);
      algorithm.params.push(['mindiff', document.getElementById('search-km-min-diff').value]);
    }

    itemsProcessed = 0;
    itemsTotal = 0;
    document.getElementById('results').innerHTML = '';
    document.getElementById('progress-bar').style.display = 'initial'
    document.getElementById('progress-value').style.display = 'initial';

    var searchCount = document.getElementById('search-count').value;
    var requestUrl = '/search?text=' + searchText + '&count=' + searchCount;

    var request = new XMLHttpRequest();
    request.addEventListener('readystatechange', getResults);
    request.open("GET", requestUrl, true);
    request.send();
  }

  function getResults() {
    if (this.readyState == 4 && this.status == 200) {
      results = JSON.parse(this.responseText);
      results.forEach(similarityOrder);
      itemsTotal = results.length;
    }
  }

  function similarityOrder(result) {
    searchColor = document.getElementById('search-color').value;

    var farmId = result.farm_id;
    var serverId = result.server_id;
    var id = result.id;
    var secret = result.secret;
    var userId = result.user;

    var thumbnailUrl = 'https://farm' + farmId + '.staticflickr.com/' + serverId + '/' + id + '_' + secret + '_m.jpg';
    var photoUrl = 'https://farm' + farmId + '.staticflickr.com/' + serverId + '/' + id + '_' + secret + '_z.jpg';
    var linkUrl = 'https://www.flickr.com/photos/' + userId + '/' + id;

    var requestUrl = '/similarity?id=' + id + '&url=' + thumbnailUrl + '&color=' + encodeURIComponent(searchColor) + '&type=' + algorithm.type;
    for (var i = 0; i < algorithm.params.length; i++) {
      var param = algorithm.params[i];
      requestUrl += ('&' + param[0] + '=' + param[1]);
    }

    var request = new XMLHttpRequest();
    request.addEventListener('readystatechange', function() {
      if (this.readyState == 4 && this.status == 200) {
        displayImage(JSON.parse(this.responseText), photoUrl, linkUrl);
      }
    });
    request.open("GET", requestUrl, true);
    request.send();
  }

  function displayImage(similarity, photoUrl, linkUrl) {
    itemsProcessed++;
    progressValue = document.getElementById('progress-value');
    progressValue.style.width = ((itemsProcessed / itemsTotal) * 100) + '%';

    var resultList = document.getElementById('results');
    var resultItems = resultList.getElementsByTagName('li');

    var newListItem = document.createElement('li');
    var imgWrapper = document.createElement('div');
    imgWrapper.className = 'image-wrapper';
    imgWrapper.style.width = '200px';
    imgWrapper.style.height = '200px';
    imgWrapper.style.textAlign = 'center';
    imgWrapper.style.margin = '0 0.2em 0.2em 0.2em';
    imgWrapper.style.overflow = 'hidden';
    var imgLink = document.createElement('a');
    imgLink.href = linkUrl;
    imgLink.target = '_blank';
    var img = document.createElement('div');
    img.className = 'image';
    img.style.backgroundImage = "url('" + photoUrl + "')";
    var imgMeta = document.createElement('p');
    imgMeta.style.height = '12px';
    imgMeta.style.width = '200px';
    imgMeta.style.textAlign = 'center';
    imgMeta.style.margin = 0;

    if (algorithm.type != 'tc') {
      var imgMetaDelta = document.createElement('span');
      imgMetaDelta.className = 'img-meta';
      var delta = document.createTextNode('Δ ');
      var deltaValue = document.createElement('span');
      deltaValue.className = 'similarity';
      deltaValue.dataset.deltaE = similarity.deltaE;
      deltaValue.innerText = similarity.deltaE.toFixed(2);
      imgMetaDelta.appendChild(delta);
      imgMetaDelta.appendChild(deltaValue);
      imgMeta.appendChild(imgMetaDelta);
    }

    if (algorithm.type != 'km') {
      var imgMetaPercent = document.createElement('span');
      imgMetaPercent.className = 'img-meta';
      var percent = document.createTextNode('% ');
      var percentValue = document.createElement('span');
      percentValue.className = 'percentage';
      if (algorithm.type == 'tc' || algorithm.type == 'kmtc') {
        percentValue.dataset.thresholdPercentage = similarity.threshold_percentage;
        percentValue.innerText = similarity.threshold_percentage.toFixed(2);
      }
      else {
        percentValue.dataset.clusterPercentage = similarity.cluster_percentage;
        percentValue.innerText = similarity.cluster_percentage.toFixed(2);
      }
      imgMetaPercent.appendChild(percent);
      imgMetaPercent.appendChild(percentValue);
      imgMeta.appendChild(imgMetaPercent);
    }

    imgLink.appendChild(img);
    imgWrapper.appendChild(imgLink);
    imgWrapper.appendChild(imgMeta);
    newListItem.appendChild(imgWrapper);

    img.addEventListener('mouseenter', function() {
      var searchColor = document.getElementById('search-color').value
      img.style.boxShadow = '0 0 0 0.15em ' + searchColor + ' inset';
      img.style.height = '184px';
    })
    img.addEventListener('mouseleave', function() {
      img.style.boxShadow = 'none';
      img.style.height = '200px';
    })

    if (algorithm.type == 'tc') {
      if (resultItems.length == 0) {
        resultList.appendChild(newListItem);
      }
      else {
        var flag = false;
        for (var i = 0; i < resultItems.length; i++) {
          if (similarity.threshold_percentage > parseFloat(resultItems[i].childNodes[0].childNodes[1].childNodes[0].childNodes[1].dataset.thresholdPercentage)) {
            resultList.insertBefore(newListItem, resultItems[i]);
            flag = true;
            break;
          }
        }
        if (!flag) resultList.appendChild(newListItem);
      }
    }
    else if (algorithm.type == 'km') {
      if (resultItems.length == 0) {
        resultList.appendChild(newListItem);
      }
      else {
        var flag = false;
        for (var i = 0; i < resultItems.length; i++) {
          if (similarity.deltaE < parseFloat(resultItems[i].childNodes[0].childNodes[1].childNodes[0].childNodes[1].dataset.deltaE)) {
            resultList.insertBefore(newListItem, resultItems[i]);
            flag = true;
            break;
          }
        }
        if (!flag) resultList.appendChild(newListItem);
      }
    }
    else if (algorithm.type == 'kmcc') {
      if (resultItems.length == 0) {
        resultList.appendChild(newListItem);
      }
      else {
        var flag = false;
        for (var i = 0; i < resultItems.length; i++) {
          var targetMetric = similarity.deltaE * (1 / (similarity.cluster_percentage / 100));
          var source = resultItems[i].childNodes[0].childNodes[1];
          var covEffect = parseFloat(document.getElementById('search-cov-effect').value);
          var sourceMetric = parseFloat(source.childNodes[0].childNodes[1].dataset.deltaE) * (1 / Math.pow((parseFloat(source.childNodes[1].childNodes[1].dataset.clusterPercentage) / 100), covEffect));

          if (targetMetric <= sourceMetric) {
            if (targetMetric == sourceMetric && similarity.deltaE > parseFloat(source.childNodes[0].childNodes[1].dataset.deltaE))
              resultList.appendChild(newListItem);
            else
              resultList.insertBefore(newListItem, resultItems[i]);
            flag = true;
            break;
          }
        }
        if (!flag) resultList.appendChild(newListItem);
      }
    }
    else {
      if (resultItems.length == 0) {
        resultList.appendChild(newListItem);
      }
      else {
        var flag = false;
        for (var i = 0; i < resultItems.length; i++) {
          var targetMetric = similarity.deltaE * (1 / (similarity.threshold_percentage / 100));
          var source = resultItems[i].childNodes[0].childNodes[1];
          var covEffect = parseFloat(document.getElementById('search-cov-effect').value);
          var sourceMetric = parseFloat(source.childNodes[0].childNodes[1].dataset.deltaE) * (1 / Math.pow((parseFloat(source.childNodes[1].childNodes[1].dataset.thresholdPercentage) / 100), covEffect));

          if (targetMetric <= sourceMetric) {
            if (targetMetric == sourceMetric && similarity.deltaE > parseFloat(source.childNodes[0].childNodes[1].dataset.deltaE))
              resultList.appendChild(newListItem);
            else
              resultList.insertBefore(newListItem, resultItems[i]);
            flag = true;
            break;
          }
        }
        if (!flag) resultList.appendChild(newListItem);
      }
    }

    if (itemsProcessed == itemsTotal) {
      document.getElementById('progress-bar').style.display = 'none';
      document.getElementById('progress-value').style.display = 'none';
      document.getElementById('progress-value').style.width = '0%';
    }
  }

})();
