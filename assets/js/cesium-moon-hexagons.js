var viewer;
const R = 1737400; 
const MOONIAU2000 = new Cesium.Ellipsoid(1737400, 1737400, 1737400);
Cesium.Ellipsoid.WGS84 = MOONIAU2000;// Hack for true entitys generation. This is bug in Cesium

var parcels = [];
var zoom_level;
var selectedEntity = null;
var tempEntities = [];

const PACELCOUNT = 100002;
const PARCELZOOMLEVEL = 6;

var viewModel = {
	show: true,
	alpha : 0.8
};

var toolbarElement = docId('toolbar');
var toolTipElement = docId("toolTip");
var infoBoxDescriptionElement = document.createElement("div");
	infoBoxDescriptionElement.className = 'cesium-infoBox-description';

var searchRectangle = null;
function CustomGeocoder(){}
CustomGeocoder.prototype.geocode = function (input) {
	var resource = new Cesium.Resource({
		url: site_resource.ajaxUrl,
		queryParameters: {
		'action': 'search_moon_hexagons_parcels',
		'search_input': input
		}
	});
	return resource.fetchJson().then(function (results) {
		return results.map(function (resultObject) {
		var parcel_number = parseInt(resultObject.parcel_id)-1;
		return {
			displayName: [
				resultObject.parcel_name,
				resultObject.user_name,
				resultObject.parcel_id,
			].join(", "),
			destination: parcels[parcel_number].rectangle.coordinates
		};
		});
	});
};	

initMap();

function initMap(){
	var imageryViewModels = [
		new Cesium.ProviderViewModel({
			name: 'Vector',
			iconUrl: site_resource.baseUrl + '/assets/images/Moon-Vector.png',
			creationFunction: function() {
				return new Cesium.WebMapTileServiceImageryProvider({
					url: 'https://cartocdn-gusc.global.ssl.fastly.net/opmbuilder/api/v1/map/named/opm-moon-basemap-v0-1/all/{TileMatrix}/{TileCol}/{TileRow}.png',
					format: "image/png",
					style: "default",
					ellipsoid: MOONIAU2000
				});
			}
		}),
		new Cesium.ProviderViewModel({
			name: 'HillShade',
			iconUrl: site_resource.baseUrl + '/assets/images/Moon-HillShade.png',
			creationFunction: function() {
				return new Cesium.WebMapTileServiceImageryProvider({
					url: 'https://trek.nasa.gov/tiles/Moon/EQ/LRO_WAC_Mosaic_Global_303ppd_v02/1.0.0/default/default028mm/{TileMatrix}/{TileRow}/{TileCol}.jpg',
					format: "image/jpg",
                    style: "default",
                    maximumLevel: 8,
					ellipsoid: MOONIAU2000
				});
			}
		}),
	];
	
	var terrainViewModels = [
		new Cesium.ProviderViewModel({
			name: "MOON-ELLIPSOID",
			tooltip: "MOONIAU2000",
			iconUrl: site_resource.baseUrl + "/assets/images/Ellipsoid.png",
			creationFunction: function() {
				return new Cesium.EllipsoidTerrainProvider({ ellipsoid: MOONIAU2000 });
			}
		})
	];
	
	viewer = new Cesium.Viewer('cesiumContainer',{
		baseLayerPicker: true,
		sceneMode: Cesium.SceneMode.SCENE3D,
		mapProjection: new Cesium.GeographicProjection(MOONIAU2000),
		globe: new Cesium.Globe(MOONIAU2000),
		infoBox: true,
		animation: false,
		timeline: false,
		sceneModePicker: false,
		homeButton: true,
		navigationHelpButton: false,
		CreditsDisplay: false,
		geocoder: new CustomGeocoder(),
		fullscreenButton: true,
		
		imageryProviderViewModels: imageryViewModels,
		selectedImageryProviderViewModel: imageryViewModels[0],
	
		terrainProviderViewModels: terrainViewModels,
		selectedTerrainProviderViewModel: terrainViewModels[0],
	});
    //remove moon
	viewer.scene.moon.destroy();
	delete viewer.scene.moon;

	//Atmosphere properties  Manuel Bolla
	viewer.scene.skyAtmosphere.hueShift = 0.47;
	viewer.scene.skyAtmosphere.brightnessShift = -0.6
	viewer.scene.skyAtmosphere.saturationShift = - 0.1

    // remove cregit element
	var creditDisplayElement = viewer.bottomContainer;
	creditDisplayElement.parentNode.removeChild(creditDisplayElement);
	
	var infoBoxElement = viewer.infoBox.frame.parentElement;
	// remove infobox iframe
	viewer.infoBox.frame.remove();
	// append cesium-infoBox-description element
	infoBoxElement.appendChild(infoBoxDescriptionElement);
    // change geocoder input placeholder
	document.querySelector('.cesium-geocoder-input').placeholder = 'Enter a parcel name or user name...';
	
    addViewerEvents();
	
	parcels = getHexagons(PACELCOUNT);
}

function addViewerEvents(){

	Cesium.knockout.track(viewModel);
	var toolbar = docId('toolbar');
	Cesium.knockout.applyBindings(viewModel, toolbar);
	Cesium.knockout.getObservable(viewModel, 'show').subscribe(
        function(newValue) {
			if(newValue){
				for(var key in tempEntities){
					var entity = viewer.entities.getById(key);
					if(entity.polygon.material.image){
						entity.polygon.material.color = Cesium.Color.WHITE.withAlpha(viewModel.alpha);
					}
				}
			}else{
				for(var key in tempEntities){
					var entity = viewer.entities.getById(key);
					if(entity.polygon.material.image){
						entity.polygon.material.color = Cesium.Color.WHITE.withAlpha(0.01);
					}
				}
			}
        }
	);

    Cesium.knockout.getObservable(viewModel, 'alpha').subscribe(
        function(newValue) {
			if(viewModel.show){
				for(var key in tempEntities){
					var entity = viewer.entities.getById(key);
					if(entity.polygon.material.image){
						entity.polygon.material.color = Cesium.Color.WHITE.withAlpha(newValue);
					}
				}
			}
        }
	);

	viewer.geocoder.viewModel.destinationFound = function(viewModel, destination) {
		searchRectangle = destination;
		viewer.camera.setView({
			destination:{
				west: destination.west - (destination.east-destination.west)/2,
				south: destination.south - (destination.north-destination.south)/2,
				east: destination.east + (destination.east-destination.west)/2,
				north: destination.north + (destination.north-destination.south)/2
			}
		});
	};

	viewer.screenSpaceEventHandler.setInputAction(function onMouseMove(movement) {
		var mousePosition = movement.endPosition;
		var ellipsoid = viewer.scene.globe.ellipsoid;
		var cartesian = viewer.camera.pickEllipsoid(mousePosition, ellipsoid);
		if (cartesian) {
			var cartographic = ellipsoid.cartesianToCartographic(cartesian);
			var longitudeString = Cesium.Math.toDegrees(cartographic.longitude).toFixed(4);
			var latitudeString = Cesium.Math.toDegrees(cartographic.latitude).toFixed(4);
			var coordinates_str = 'Lat:'+latitudeString + ', Lng:'+longitudeString ; 
			docId("coordinates").style.display = 'block';
			docId("coordinates").innerHTML = coordinates_str;
		} else {
			docId("coordinates").style.display = 'none';
		}
	}, Cesium.ScreenSpaceEventType.MOUSE_MOVE);

	viewer.screenSpaceEventHandler.setInputAction(function onLeftClick(movement) {
		if(zoom_level < PARCELZOOMLEVEL ) return;
		var pickedObject = viewer.scene.pick(movement.position);
		if (!Cesium.defined(pickedObject)) {
			return;
		}
		if(!pickedObject.id) return;
		
		setSelection(pickedObject.id);

	}, Cesium.ScreenSpaceEventType.LEFT_CLICK);

	viewer.camera.moveEnd.addEventListener(function(e) {
		var newTempEntities = [];
		var rectView = viewer.camera.computeViewRectangle();
		var height = null;
		var ellipsoid = viewer.scene.globe.ellipsoid;
		switch (viewer.scene.mode) {
			case Cesium.SceneMode.SCENE2D:
				height = (viewer.camera.frustum.right - viewer.camera.frustum.left) * 0.5;
				break;
			case Cesium.SceneMode.SCENE3D:
				height = ellipsoid.cartesianToCartographic(viewer.camera.position).height;
				break;
			case Cesium.SceneMode.COLUMBUS_VIEW:
				height = viewer.camera.position.z;
				break;
		}
		if(height){
			zoom_level = getZoomLevel(height);
			var height_value = height/1000; //km
			var altitude = height_value > 1 ? parseInt(height_value): height_value.toFixed(2);
			docId("altitude").style.display = 'block';
			
			if(zoom_level < PARCELZOOMLEVEL){
				toolbarElement.style.display = 'none';
				toolTipElement.style.display = 'none';
				docId("altitude").innerHTML = `Altitude: ${numeral(altitude).format('0,0.[00]')} km | Zoom: ${zoom_level}`;
				viewer.entities.removeAll();
				tempEntities = [];
			}else{
				toolbarElement.style.display = 'block';
				docId("altitude").innerHTML = `Altitude: ${numeral(altitude).format('0,0.[00]')} km | Zoom: ${zoom_level} | ${numeral(parcels.length).format('0,0')} parcels`;
				var parcel_ids = [];
				var filters = parcels.filter(entity=>{
					//var entityRectangle = Cesium.Rectangle.fromCartesianArray(entity.polygon.hierarchy.positions);
					var entityRectangle = entity.rectangle.coordinates;
					Cesium.Rectangle.intersection(rectView, entityRectangle) // Rectangle|undefined
					var intersect = Cesium.Rectangle.intersection(rectView, entityRectangle);
					return typeof intersect != 'undefined' ? true : false;
				});
				filters.forEach(entity=>{
					newTempEntities[entity.id] = entity;
					parcel_ids.push(`'${entity.id}'`);
				});

				for(var key in tempEntities){
					if(!newTempEntities[key]){
						viewer.entities.removeById(key);
					}
				}
				for(var key in newTempEntities){
					if(!tempEntities[key]){
						viewer.entities.add(newTempEntities[key]);   
					}
				}

				tempEntities = newTempEntities;

				// check search
                if(searchRectangle){
					var searchEntity = null;
					var searchCenterCartographic = Cesium.Rectangle.center(searchRectangle);
					for(var key in tempEntities){
						if(Cesium.Rectangle.contains(tempEntities[key].rectangle.coordinates, searchCenterCartographic)){
						   searchEntity = viewer.entities.getById(key);
						   break;
						}
					}
					searchRectangle = null;
					if(searchEntity){
                       setSelection(searchEntity);
					}
				}
				
				const formData = new FormData();
				formData.append("action", "get_moon_hexagons_parcel_ids");
				formData.append("parcel_ids", parcel_ids.join(","));
				fetch(site_resource.ajaxUrl, {
					method: 'POST',
					body: formData
				})
				.then(response => response.json())
				.then(result => {
					if(result.length > 0){
						result.forEach(item=>{
							var entity = viewer.entities.getById(item.parcel_id);
							if(!entity.polygon.material.image){
								var imageUrl = site_resource.uploadUrl + `/moon-hexagons/${item.parcel_id}.png?${Date.now()}`;
								entity.polygon.material = new Cesium.ImageMaterialProperty({
									image: imageUrl,
									color: Cesium.Color.WHITE.withAlpha(0.01),
									transparent: true
								});
								if(viewModel.show){
									entity.polygon.material.color = Cesium.Color.WHITE.withAlpha(viewModel.alpha);
								}
							}
						});
					}
				})
				.catch(error => {
					console.error('Error:' + error);
				});
			}
		}else{
			docId("altitude").style.display = 'none';
		}
	});

	infoBoxDescriptionElement.addEventListener('click', async function(e){
		if(e.target && e.target.id== 'buy-parcel'){
			infoBoxDescriptionElement.innerHTML = [
				'<table class="form-table"><tbody>',
				`<tr><td>Image</td><td><input type="file" class="cesium-button" id="parcel_image" accept=".png, .jpg, .jpeg" required style="width:100%;"></td></tr>`,
				`<tr><td></td><td><span id="parcel_image_error" style="color:red;font-size:14px;height:16px"></span></td></tr>`,
				`<tr><td>Parcel Name</td><td><input type="text" class="cesium-button" id="parcel_name" style="width:100%" required></td></tr>`,
				`<tr><td></td><td><span id="parcel_name_error" style="color:red;font-size:14px;height:16px"></span></td></tr>`,
				`<tr><td>Description</td><td><textarea class="cesium-button" id="parcel_description" rows="6" style="width:100%; resize:none"></textarea></td></tr>`,
				`<tr><td>Area Status</td><td>`,
					`<select id="parcel_status" class="cesium-button" style="width:100%">`,
					   `<option value="Occupied">Occupied</option>`,
					   `<option value="Available">Available</option>`,
					   `<option value="Locked">Locked</option>`,
					`</select>`,
				`</td></tr>`,
				`<tr><td>Youtube</td><td><input type="url" class="cesium-button" id="parcel_youtube" style="width:100%"></td></tr>`,
				`<tr><td></td><td><span id="parcel_youtube_error" style="color:red;font-size:14px;height:16px"></span></td></tr>`,
				'</tbody></table>',
				`<div style="margin-top:10px;text-align:center">`,
					`<button id="buy-yes" class="cesium-button" style="margin-right:20px">Submit</button>`,
					`<button id="buy-cancel" class="cesium-button">Cancel</button>`,
				`</div>`,
			].join("");
		}
		if(e.target && e.target.id== 'buy-cancel'){
			infoBoxDescriptionElement.innerHTML = [
				'<div>This parcel is free.</div>',
				`<div>You can <button id="buy-parcel" class="cesium-button">Buy</button> this parcel.</div>`,
			].join("");
		}
		if(e.target && e.target.id== 'release-parcel'){
			infoBoxDescriptionElement.innerHTML = [
				`<div style="margin-top:10px;text-align:center;">`,
					`<p>Are you sure to release this parcel ?</p>`,
					`<button id="release-yes" class="cesium-button" style="margin-right:20px">Yes</button>`,
					`<button id="release-cancel" class="cesium-button">Cancel</button>`,
				`</div>`,
			].join('');
		}
		if(e.target && e.target.id== 'release-yes'){
			const formData = new FormData();
			formData.append("action", "remove_moon_hexagons_parcel");
			formData.append("parcel_id", selectedEntity.id);
			infoBoxDescriptionElement.innerHTML = 'Release <div class="cesium-infoBox-loading"></div>';
			fetch(site_resource.ajaxUrl, {
				method: 'POST',
				body: formData
			})
			.then(response => response.json())
			.then(result => {
				selectedEntity.polygon.material = Cesium.Color.WHITE.withAlpha(0.01);
				infoBoxDescriptionElement.innerHTML = [
					'<div>This parcel is free.</div>',
					`<div>You can <button id="buy-parcel" class="cesium-button">Buy</button> this parcel.</div>`,
				].join("");
			})
			.catch(error => {
				//console.error('Error:', error);
				infoBoxDescriptionElement.innerHTML = '<div style="color:red">Release Error</div>';
			});
		}
		if(e.target && (e.target.id== 'release-cancel' || e.target.id== 'update-cancel')){
			infoBoxDescriptionElement.innerHTML = parcelInfoDescription(selectedEntity.properties.getValue());
		}
		if(e.target && e.target.id== 'update-parcel'){
			var obj = selectedEntity.properties.getValue();
			var parcelInfo = obj.parcels[0];
			infoBoxDescriptionElement.innerHTML = [
				'<table class="form-table"><tbody>',
				`<tr><td>Image</td><td><input type="file" class="cesium-button" id="parcel_image" accept=".png, .jpg, .jpeg" style="width:100%;" required></td></tr>`,
				`<tr><td>Parcel Name</td><td>`,
					`<input type="text" class="cesium-button" id="parcel_name" value="${parcelInfo.parcel_name}" style="width:100%" required>`,
				`</td></tr>`,
				`<tr><td></td><td><span id="parcel_name_error" style="color:red;font-size:14px;height:16px"></span></td></tr>`,
				`<tr><td>Description</td><td>`,
					`<textarea class="cesium-button" id="parcel_description" rows="6" style="width:100%; resize:none" required>${parcelInfo.parcel_description}</textarea>`,
				`</td></tr>`,
				`<tr><td>Area Status</td><td>`,
					`<select id="parcel_status" class="cesium-button" style="width:100%">`,
						`<option value="Occupied">Occupied</option>`,
						`<option value="Available">Available</option>`,
						`<option value="Locked">Locked</option>`,
					`</select>`,
				`</td></tr>`,
				`<tr><td>Youtube</td><td><input type="url" class="cesium-button" id="parcel_youtube" value="${parcelInfo.parcel_youtube}" style="width:100%"></td></tr>`,
				`<tr><td></td><td><span id="parcel_youtube_error" style="color:red;font-size:14px;height:16px"></span></td></tr>`,
				'</tbody></table>',
				`<div style="margin-top:10px;text-align:center">`,
					`<button id="update-yes" class="cesium-button" style="margin-right:20px">Submit</button>`,
					`<button id="update-cancel" class="cesium-button">Cancel</button>`,
				`</div>`,
			].join("");

			docId("parcel_status").value = parcelInfo.parcel_status;

		}
		if(e.target && e.target.id== 'update-yes'){
			// check validate 
			var validationError = [];
	
			docId("parcel_name_error").innerHTML='';
	
			if(!docId("parcel_name").checkValidity()){
				docId("parcel_name_error").innerHTML = docId("parcel_name").validationMessage;
				validationError.push(docId("parcel_name").validationMessage);
			}
			if(docId("parcel_youtube").value && !validateYouTubeUrl(docId("parcel_youtube").value)){
				docId("parcel_youtube_error").innerHTML = "Youtube link is not correct.";
				validationError.push("Youtube link is not correct.");
			}
			if(validationError.length > 0){
				return;
			}
			const formData = new FormData();
			formData.append("action", "update_moon_hexagons_parcel");
			formData.append("parcel_id", selectedEntity.id);
			if(docId("parcel_image").checkValidity()){
				var newImageFile = await compress(docId("parcel_image").files[0], selectedEntity.id+'.png');
				formData.append("parcel_image", newImageFile);
			}
			formData.append("parcel_name", docId("parcel_name").value);
			formData.append("parcel_description", docId("parcel_description").value);
			formData.append("parcel_status", docId("parcel_status").value);
			formData.append("parcel_youtube", docId("parcel_youtube").value);

			infoBoxDescriptionElement.innerHTML = 'Updating <div class="cesium-infoBox-loading"></div>';
			docId("cesiumContainer").style.pointerEvents = "none";
			fetch(site_resource.ajaxUrl, {
				method: 'POST',
				body: formData
			})
			.then(response => response.json())
			.then(result => {
				if(result.parcels.length>0){
					var parcelInfo = result.parcels[0];
					//selectedEntity.polygon.material
					selectedEntity.polygon.material = new Cesium.ImageMaterialProperty({
						image: site_resource.uploadUrl + `/moon-hexagons/${selectedEntity.id}.png?${Date.now()}`,
						color: Cesium.Color.WHITE.withAlpha(0.01),
						transparent: true
					});
					if(viewModel.show){
						selectedEntity.polygon.material.color = Cesium.Color.WHITE.withAlpha(viewModel.alpha);
					}
					selectedEntity.properties = result;
					infoBoxDescriptionElement.innerHTML = parcelInfoDescription(result);
				}else{
					infoBoxDescriptionElement.innerHTML = '<div style="color:red">Submit Error</div>';
				}
				docId("cesiumContainer").style.pointerEvents = "all";
			})
			.catch(error => {
				//console.error('Error:', error);
				infoBoxDescriptionElement.innerHTML = '<div style="color:red">Submit Error</div>';
			});
		}
		if(e.target && e.target.id== 'buy-yes'){
			// check validate 
			var validationError = [];
			docId("parcel_image_error").innerHTML='';
			docId("parcel_name_error").innerHTML='';
	
			if(!docId("parcel_image").checkValidity()){
				docId("parcel_image_error").innerHTML = docId("parcel_image").validationMessage;
				validationError.push(docId("parcel_image").validationMessage);
			}
			if(!docId("parcel_name").checkValidity()){
				docId("parcel_name_error").innerHTML = docId("parcel_name").validationMessage;
				validationError.push(docId("parcel_name").validationMessage);
			}
			if(docId("parcel_youtube").value && !validateYouTubeUrl(docId("parcel_youtube").value)){
				docId("parcel_youtube_error").innerHTML = "Youtube link is not correct.";
				validationError.push("Youtube link is not correct.");
			}
			if(validationError.length > 0){
				return;
			}
	
			const formData = new FormData();
			formData.append("action", "add_moon_hexagons_parcel");
			formData.append("parcel_id", selectedEntity.id);
			var newImageFile = await compress(docId("parcel_image").files[0], selectedEntity.id+'.png');
			formData.append("parcel_image", newImageFile);
			formData.append("parcel_name", docId("parcel_name").value);
			formData.append("parcel_description", docId("parcel_description").value);
			formData.append("parcel_status", docId("parcel_status").value);
			formData.append("parcel_youtube", docId("parcel_youtube").value);
	
			infoBoxDescriptionElement.innerHTML = 'Buying <div class="cesium-infoBox-loading"></div>';
			docId("cesiumContainer").style.pointerEvents = "none";
			fetch(site_resource.ajaxUrl, {
				method: 'POST',
				body: formData
			})
			.then(response => response.json())
			.then(result => {
				if(result.parcels.length>0){
					var parcelInfo = result.parcels[0];
					//selectedEntity.polygon.material
					selectedEntity.polygon.material = new Cesium.ImageMaterialProperty({
						image: site_resource.uploadUrl + `/moon-hexagons/${selectedEntity.id}.png?${Date.now()}`,
						color: Cesium.Color.WHITE.withAlpha(0.01),
						transparent: true
					});
					if(viewModel.show){
						selectedEntity.polygon.material.color = Cesium.Color.WHITE.withAlpha(viewModel.alpha);
					}
					selectedEntity.properties = result;
					infoBoxDescriptionElement.innerHTML = parcelInfoDescription(result);
				}else{
					infoBoxDescriptionElement.innerHTML = [
						'<div style="color:red">Submit Error</div>',
						`<div>You can <button id="buy-parcel" class="cesium-button">Buy</button> this parcel again.</div>`,
					].join("");
				}
				docId("cesiumContainer").style.pointerEvents = "all";
			})
			.catch(error => {
				//console.error('Error:', error);
				infoBoxDescriptionElement.innerHTML = [
					'<div style="color:red">Submit Error</div>',
					`<div>You can <button id="buy-parcel" class="cesium-button">Buy</button> this parcel again.</div>`,
				].join("");
			});
		}
	});
}

 function getZoomLevel(altitude_value){
    return Math.round(Math.log(2*Math.PI*R/altitude_value)/Math.log(2));
 }

 function compress(imageFile, newFileName) {
	return new Promise(resolve => {
		const width = 256;
		const height = 256;
		const reader = new FileReader();
		reader.readAsDataURL(imageFile);
		reader.onload = event => {
			const img = new Image();
			img.src = event.target.result;
			img.onload = () => {
					const elem = document.createElement('canvas');
					elem.width = width;
					elem.height = height;
					const ctx = elem.getContext('2d');
					// img.width and img.height will contain the original dimensions
					ctx.drawImage(img, 0, 0, width, height);
					ctx.canvas.toBlob((blob) => {
						const file = new File([blob], newFileName, {
							type: 'image/png',
							lastModified: Date.now()
						});
						resolve(file);
					}, 'image/png', 1);
				},
			reader.onerror = error => console.log(error);
		};
	});
 }	

 function docId(id){
    return document.getElementById(id);
 }
 
 function setSelection(entity){
	
	selectedEntity = entity;
	
	viewer.selectedEntity = selectedEntity;

	var selectedRectangle = selectedEntity.rectangle.coordinates.getValue();
	var north = Cesium.Math.toDegrees(selectedRectangle.north),
		south = Cesium.Math.toDegrees(selectedRectangle.south),
		west = Cesium.Math.toDegrees(selectedRectangle.west),
		east = Cesium.Math.toDegrees(selectedRectangle.east);

	toolTipElement.style.display = 'block';
	toolTipElement.innerHTML= [
		'<table class="cesium-infoBox-defaultTable"><tbody>',
		`<tr><th>ID</th><td>${selectedEntity.id}</td></tr>`,
		`<tr><th>North</th><td>${north.toFixed(6)}</td></tr>`,
		`<tr><th>West</th><td>${west.toFixed(6)}</td></tr>`,
		`<tr><th>East</th><td>${east.toFixed(6)}</td></tr>`,
		`<tr><th>South</th><td>${south.toFixed(6)}</td></tr>`,
		'</tbody></table>'
	].join('');
	
	infoBoxDescriptionElement.innerHTML = 'Loading <div class="cesium-infoBox-loading"></div>';

	const formData = new FormData();
	formData.append("action", "get_moon_hexagons_parcel");
	formData.append("parcel_id", selectedEntity.id);
	fetch(site_resource.ajaxUrl, {
		method: 'POST',
		body: formData
	})
	.then(response => response.json())
	.then(result => {
		selectedEntity.properties = result;
		infoBoxDescriptionElement.innerHTML = parcelInfoDescription(result);
	})
	.catch(error => {
		console.error('Error:', error);
		infoBoxDescriptionElement.innerHTML = 'Error Parcel Info';
	});
 }

 function parcelInfoDescription(response){
	if(response.parcels.length > 0){
		var parcelInfo = response.parcels[0];
		var social_media = response.social_media;
		var html_arr = [ 
			'<table class="cesium-infoBox-defaultTable"><tbody>',
				`<tr><th>Parcel ID</th><td>${parcelInfo.parcel_id}</td></tr>`,
				`<tr><th>Parcel Name</th><td>${parcelInfo.parcel_name}</td></tr>`,
				`<tr><th>Description</th><td>${parcelInfo.parcel_description}</td></tr>`,
				`<tr><th>Area Status</th><td>${parcelInfo.parcel_status}</td></tr>`,
				`<tr><th>Created</th><td>${parcelInfo.created_datetime}</td></tr>`,
				`<tr><th>Updated</th><td>${parcelInfo.updated_datetime}</td></tr>`,
				`<tr><th>User Name</th><td><a href="${site_resource.siteUrl}/profile/${parcelInfo.user_name}" target="_blank">${parcelInfo.user_name}</a></td></tr>`,
				`<tr><th>Website</th><td><a href="${parcelInfo.user_url}" target="_blank">${parcelInfo.user_url}</a></td></tr>`,
				`<tr><th>Social Media</th><td><div class="social-icons">`
		];
		//youtube, facebook, twitter, linkedin, googleplus, instagram, skype
		if(social_media.youtube){
			html_arr.push(`<a href="${social_media.youtube}" class="fa fa-youtube" target="_blank" title="youtube"></a>`);
		}
		if(social_media.facebook){
			html_arr.push(`<a href="${social_media.facebook}" class="fa fa-facebook" target="_blank" title="facebook"></a>`);
		}
		if(social_media.twitter){
			html_arr.push(`<a href="${social_media.twitter}" class="fa fa-twitter" target="_blank" title="twitter"></a>`);
		}
		if(social_media.linkedin){
			html_arr.push(`<a href="${social_media.linkedin}" class="fa fa-linkedin" target="_blank" title="linkedin"></a>`);
		}
		if(social_media.googleplus){
			html_arr.push(`<a href="${social_media.googleplus}" class="fa fa-google-plus" target="_blank" title="google plus"></a>`);
		}
		if(social_media.instagram){
			html_arr.push(`<a href="${social_media.instagram}" class="fa fa-instagram" target="_blank" title="instagram"></a>`);
		}
		html_arr.push('</div></td></tr>');

		if(parcelInfo.parcel_youtube){
			var youtube_video_id = getYoutubeVideoId(parcelInfo.parcel_youtube);
			if(youtube_video_id){
				html_arr = html_arr.concat([
					`<tr><td colspan="2" style="padding:0;line-height:0">`,
					   `<iframe width="100%" height="200px" frameborder="0" src="https://www.youtube.com/embed/${youtube_video_id}" allowfullscreen></iframe>`,				
					`</td></tr>`
				]);
			}
		}

		html_arr.push('</tbody></table>');
		
		if(response.client_user_id == parcelInfo.parcel_user_id){
			html_arr = html_arr.concat([
				`<div style="margin-top:10px;text-align:center;">`,
					`<button id="update-parcel" class="cesium-button" style="margin-right:20px">Update</button>`,
					`<button id="release-parcel" class="cesium-button">Release</button>`,
				`</div>`
			]);
		}else{
			html_arr = html_arr.concat([
				`<div style="margin-top:10px;text-align:center">`,
				  `This parcel is private. You can't buy this parcel`,
				`</div>`
			]);
		}

		return html_arr.join('');
	}else{
		if(response.client_user_id > 0){
			return [
				'<div>This parcel is free.</div>',
			    `<div>You can <button id="buy-parcel" class="cesium-button">Buy</button> this parcel.</div>`,
		   ].join("");
		}else{
			return [
         		`<div>This parcel is free.</div>`,
				`<div>You have to login to buy this parcel.<div>`,
			].join("");
		}
	}
 }

function getYoutubeVideoId(url){
	var regExp = /^https?\:\/\/(?:www\.youtube(?:\-nocookie)?\.com\/|m\.youtube\.com\/|youtube\.com\/)?(?:ytscreeningroom\?vi?=|youtu\.be\/|vi?\/|user\/.+\/u\/\w{1,2}\/|embed\/|watch\?(?:.*\&)?vi?=|\&vi?=|\?(?:.*\&)?vi?=)([^#\&\?\n\/<>"']*)/i;
	var match = url.match(regExp);
	return (match && match[1].length==11)? match[1] : false;
}

function validateYouTubeUrl(url){
	if (url) {
		var regExp = /^(?:https?:\/\/)?(?:m\.|www\.)?(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|watch\?.+&v=))((\w|-){11})(?:\S+)?$/;
		if (url.match(regExp)) {
			return true;
		}
	}
	return false;
}

function getHexagons(count){
	var result = [];
	var n = Math.floor(Math.sqrt((count-2)/10)); // count = 10*n^2+2
	var hexasphere = new Hexasphere(R, n, 1); 
	hexasphere.tiles.forEach((item, index)=>{
		var boundary = item.boundary;
		var positions = [];
		boundary.forEach(point=>{
			positions.push(new Cesium.Cartesian3(point.x,point.y,point.z));
		});
		result.push({
			id: index+1, 
			polygon:{
				hierarchy: {
					positions: positions,
					holes:[]
				},
				fill: true,
				material: Cesium.Color.WHITE.withAlpha(0.01),
				height: 0,
				outline: true, // height must be set for outline to display
				outlineColor: Cesium.Color.BLACK,
			},
			rectangle:{
				coordinates: Cesium.Rectangle.fromCartesianArray(positions),
				fill:false,
				outline:false
			}
		});
	});
		
	return result;
}