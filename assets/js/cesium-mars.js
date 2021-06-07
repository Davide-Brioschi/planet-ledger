let viewer;
const R = 3396000; // 3396190, 3376200
const MARSIAU2000 = new Cesium.Ellipsoid(3396000.0, 3396000.0, 3396000.0);
Cesium.Ellipsoid.WGS84 = MARSIAU2000;// Hack for true entitys generation. This is bug in Cesium

let parcels = [];
let zoom_level;
let cursorMarkerEntity = null, selectedMarkerEntity = null;
let selectedParcelEntity = null;
let tempEntities = [], tempImageryLayers = [];

const PACELCOUNT = 1000000;
const PARCELZOOMLEVEL = 7;

let viewModel = {
	alpha: 0.5
};

let opacityBarElement = docId('opacity-bar');
let infoBoxElement;
let infoBoxDescriptionElement = document.createElement("div");
infoBoxDescriptionElement.className = 'cesium-infoBox-description';

let searchRectangle = null;

let listLayers = null, listLandmarks = null;
let cropper = null;
let selectedLayerResponse = null, selectedLandmarkResponse = null;

function CustomGeocoder() { }
CustomGeocoder.prototype.geocode = function (input) {
	var resource = new Cesium.Resource({
		url: site_resource.ajaxUrl,
		queryParameters: {
			'action': 'search_mars_parcels',
			'search_input': input
		}
	});
	return resource.fetchJson().then(function (results) {
		return results.map(function (resultObject) {
			var parcel_number = parseInt(resultObject.parcel_id) - 1;
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

function initMap() {
	var imageryViewModels = [
		new Cesium.ProviderViewModel({
			name: 'Vector',
			iconUrl: site_resource.baseUrl + '/assets/images/VectorThumb.png',
			creationFunction: function () {
				return new Cesium.WebMapTileServiceImageryProvider({
					url: 'https://cartocdn-gusc.global.ssl.fastly.net/opmbuilder/api/v1/map/named/opm-mars-basemap-v0-2/all/{TileMatrix}/{TileCol}/{TileRow}.png',
					format: "image/png",
					style: "default",
					ellipsoid: MARSIAU2000
				});
			}
		}),
		new Cesium.ProviderViewModel({
			name: 'High-Viking',
			iconUrl: site_resource.baseUrl + '/assets/images/HighVikingThumb.png',
			tooltip: 'Mars_Viking_MDIM21_ClrMosaic_global_232m',
			creationFunction: function () {
				return new Cesium.WebMapTileServiceImageryProvider({
					url: 'https://api.nasa.gov/mars-wmts/catalog/Mars_Viking_MDIM21_ClrMosaic_global_232m/1.0.0/{Style}/{TileMatrixSet}/{TileMatrix}/{TileRow}/{TileCol}.jpg',
					layer: 'Mars_Viking_MDIM21_ClrMosaic_global_232m',
					format: 'image/jpeg',
					tilingScheme: new Cesium.GeographicTilingScheme({ ellipsoid: MARSIAU2000, rectangle: Cesium.Rectangle.fromDegrees(-180, -90, 180, 90), }),
					ellipsoid: MARSIAU2000,
					maximumLevel: 9,
					style: 'default',
					tileMatrixSetID: 'default028mm',
				});
			}
		}),
		new Cesium.ProviderViewModel({
			name: 'High-Viking',
			iconUrl: site_resource.baseUrl + '/assets/images/HighVikingThumb.png',
			tooltip: 'Mars_Viking_MDIM21_ClrMosaic_global_232m',
			creationFunction: function () {
				return new Cesium.WebMapTileServiceImageryProvider({
					//url: 'https://api.nasa.gov/mars-wmts/catalog/Mars_Viking_MDIM21_ClrMosaic_global_232m/1.0.0/{Style}/{TileMatrixSet}/{TileMatrix}/{TileRow}/{TileCol}.jpg',
					url: site_resource.baseUrl + '/TilesMarsVikingS/{TileMatrix}/{TileCol}/{TileRow}.jpg',
					layer: 'Mars_Viking_MDIM21_ClrMosaic_global_232m',
					format: 'image/jpeg',
					tilingScheme: new Cesium.GeographicTilingScheme({ ellipsoid: MARSIAU2000, rectangle: Cesium.Rectangle.fromDegrees(-180, -90, 180, 90), }),
					ellipsoid: MARSIAU2000,
					maximumLevel: 4,
					style: 'default',
					tileMatrixSetID: 'default028mm',
				});
			}
		}),
		new Cesium.ProviderViewModel({
			name: 'MOLA-Color-Hillshade',
			iconUrl: site_resource.baseUrl + '/assets/images/MolaThumb.png',
			tooltip: 'Color Hillshade - Mars Orbiter Laser Altimeter',
			creationFunction: function () {
				return new Cesium.WebMapTileServiceImageryProvider({
					url: 'https://api.nasa.gov/mars-wmts/catalog/Mars_MGS_MOLA_ClrShade_merge_global_463m/1.0.0/{Style}/{TileMatrixSet}/{TileMatrix}/{TileRow}/{TileCol}.jpg',
					layer: 'Mars_MGS_MOLA_ClrShade_merge_global_463m',
					format: 'image/jpeg',
					tilingScheme: new Cesium.GeographicTilingScheme({ ellipsoid: MARSIAU2000, rectangle: Cesium.Rectangle.fromDegrees(-180, -90, 180, 90), }),
					ellipsoid: MARSIAU2000,
					maximumLevel: 8,
					style: 'default',
					tileMatrixSetID: 'default028mm',
				});
			}
		}),
		new Cesium.ProviderViewModel({
			name: 'MOLA-THEMIS',
			iconUrl: site_resource.baseUrl + '/assets/images/MolaSrThumb.png',
			tooltip: 'Infrared Day - Thermal Emission Imaging System',
			creationFunction: function () {
				return new Cesium.WebMapTileServiceImageryProvider({
					url: 'https://api.nasa.gov/mars-wmts/catalog/Mars_MO_THEMIS-IR-Day_mosaic_global_100m_v12_clon0_ly/1.0.0/{Style}/{TileMatrixSet}/{TileMatrix}/{TileRow}/{TileCol}.jpg',
					layer: 'Mars_MO_THEMIS-IR-Day_mosaic_global_100m_v12_clon0_ly',
					format: 'image/jpeg',
					tilingScheme: new Cesium.GeographicTilingScheme({ ellipsoid: MARSIAU2000, rectangle: Cesium.Rectangle.fromDegrees(-180, -90, 180, 90), }),
					ellipsoid: MARSIAU2000,
					maximumLevel: 8,
					style: 'default',
					tileMatrixSetID: 'default028mm',
				});
			}
		})
	];

	viewer = new Cesium.Viewer('cesiumContainer', {
		baseLayerPicker: true,
		mapProjection: new Cesium.GeographicProjection(MARSIAU2000),
		globe: new Cesium.Globe(MARSIAU2000),
		infoBox: true,
		animation: false,
		timeline: false,
		sceneModePicker: false,
		sceneMode: Cesium.SceneMode.SCENE3D,
		scene3DOnly: true,
		homeButton: true,
		navigationHelpButton: false,
		CreditsDisplay: false,
		geocoder: new CustomGeocoder(),
		fullscreenButton: false,
		imageryProviderViewModels: imageryViewModels,
		selectedImageryProviderViewModel: imageryViewModels[1],
		terrainProviderViewModels: []
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

	infoBoxElement = viewer.infoBox.frame.parentElement;
	// remove infobox iframe
	viewer.infoBox.frame.remove();
	// append cesium-infoBox-description element
	infoBoxElement.appendChild(infoBoxDescriptionElement);
	// change geocoder input placeholder
	document.querySelector('.cesium-geocoder-input').placeholder = 'Enter parcel or user name...';

	// set camera height limit
	//viewer.scene.screenSpaceCameraController.minimumZoomDistance = 20000;//The minimum height of the camera
	viewer.scene.screenSpaceCameraController.maximumZoomDistance = 12000000; //Maximum camera height
	viewer.scene.screenSpaceCameraController.enableTilt = false;
	viewer.scene.screenSpaceCameraController.enableLook = false;

	addViewerEvents();
	createListings();
	parcels = getParcels(PACELCOUNT);

}

function createListings() {
	listLayers = new List('list-layers-box', {
		valueNames: [
			{ data: ['id'] },
			'name',
		],
		item: [
			'<li>',
			`<img class="thumbnail" src="${site_resource.baseUrl}/assets/images/flag.png"/>`,
			'<span class="name"></span>',
			'</li>'
		].join('')
	});

	listLandmarks = new List('list-landmarks-box', {
		valueNames: [
			{ data: ['id'] },
			'name'
		],
		item: [
			'<li>',
			`<img class="thumbnail" src="${site_resource.baseUrl}/assets/images/landmark.png"/>`,
			'<span class="name"></span>',
			'</li>'
		].join('')
	});

	const formData = new FormData();
	formData.append("action", "get_mars_layers");
	fetch(site_resource.ajaxUrl, {
		method: 'POST',
		body: formData
	}).then(response => response.json()).then(result => {
		// result.layers
		result.layers.forEach(item => {
			listLayers.add({ id: 'landingsite-'+item.id, name: item.title });
			var extent = item.extent.split(",");
			for (let i = 0; i < extent.length; i++) {
				extent[i] = parseFloat(extent[i]);
			}
			var lng = (extent[0]+extent[2])/2;
			var lat = (extent[1]+extent[3])/2;
			viewer.entities.add({
				id: `landingsite-${item.id}`,
				name: "Landing site Information",
				position: Cesium.Cartesian3.fromDegrees(lng, lat, 100, MARSIAU2000),
				billboard: {
					image: site_resource.baseUrl + '/assets/images/flag.png',
					width: 28,
					height: 28,
					horizontalOrigin: Cesium.HorizontalOrigin.CENTER,
					verticalOrigin: Cesium.VerticalOrigin.BOTTOM,
					//heightReference: Cesium.HeightReference.CLAMP_TO_GROUND
				},
				label:{
					text: item.title,
					font : '14px sans-serif',
					horizontalOrigin : Cesium.HorizontalOrigin.CENTER,
					pixelOffset : new Cesium.Cartesian2(0.0, -36),
				}
			});
		});
	}).catch(error => {
			console.error('Error:', error);
	});
}

function addViewerEvents() {
	Cesium.knockout.track(viewModel);
	Cesium.knockout.applyBindings(viewModel, opacityBarElement);
	Cesium.knockout.getObservable(viewModel, 'alpha').subscribe(
		function (newValue) {
			for (var key in tempImageryLayers) {
				var index = viewer.imageryLayers.indexOf(tempImageryLayers[key]);
				if (index > 0) {
					viewer.imageryLayers.get(index).alpha = newValue;
					tempImageryLayers[key].alpha = newValue;
				}
			}
		}
	);

	viewer.geocoder.viewModel.destinationFound = function (viewModel, destination) {
		searchRectangle = destination;
		var center = Cesium.Rectangle.center(destination);
		var cartesian = Cesium.Cartesian3.fromRadians(center.longitude, center.latitude, 40000, MARSIAU2000);
		var newCartographic = Cesium.Cartographic.fromCartesian(cartesian); //WGS84
		var newDestination = Cesium.Cartesian3.fromRadians(newCartographic.longitude, newCartographic.latitude, newCartographic.height, MARSIAU2000);
		viewer.camera.flyTo({
			destination: newDestination,
			duration: 2
		});
	};

	viewer.screenSpaceEventHandler.removeInputAction(Cesium.ScreenSpaceEventType.LEFT_DOUBLE_CLICK);

	viewer.screenSpaceEventHandler.setInputAction(function onMouseMove(movement) {
		var mousePosition = movement.endPosition;
		var ellipsoid = viewer.scene.globe.ellipsoid;
		var cartesian = viewer.camera.pickEllipsoid(mousePosition, ellipsoid);
		if (cartesian) {
			var cartographic = ellipsoid.cartesianToCartographic(cartesian);
			var lat = Cesium.Math.toDegrees(cartographic.latitude).toFixed(1);
			var lng = Cesium.Math.toDegrees(cartographic.longitude).toFixed(1);
			docId("coordinates").style.display = 'block';
			docId("coordinates").innerHTML = `${Math.abs(lat)}&#176${lat > 0 ? 'N' : 'S'} ${Math.abs(lng)}&#176${lng > 0 ? 'E' : 'W'}`;
			var pickedObject = viewer.scene.pick(mousePosition);
			viewer.container.style.cursor = 'default';
			if (cursorMarkerEntity) {
				cursorMarkerEntity.billboard.width = 28;
				cursorMarkerEntity.billboard.height = 28;
				cursorMarkerEntity.label.pixelOffset = new Cesium.Cartesian2(0.0, -36);
				if(selectedMarkerEntity && (selectedMarkerEntity.id == cursorMarkerEntity.id)){
					cursorMarkerEntity.billboard.width = 36;
					cursorMarkerEntity.billboard.height = 36;
					cursorMarkerEntity.label.pixelOffset = new Cesium.Cartesian2(0.0, -48);
				}
				cursorMarkerEntity = null;
			}
			if (!Cesium.defined(pickedObject)) return;
			if (!pickedObject.id) return;
			var entity = pickedObject.id;
			//var entityId = String(entity.id);
			if (entity.billboard) {
				viewer.container.style.cursor = 'pointer';
				entity.billboard.width = 36;
				entity.billboard.height = 36;
				entity.label.pixelOffset = new Cesium.Cartesian2(0.0, -48),
				cursorMarkerEntity = entity;
			}
		} else {
			docId("coordinates").style.display = 'none';
		}
	}, Cesium.ScreenSpaceEventType.MOUSE_MOVE);

	viewer.screenSpaceEventHandler.setInputAction(function onLeftClick(movement) {
		var pickedObject = viewer.scene.pick(movement.position);
		if (!Cesium.defined(pickedObject)) return;
		if (!pickedObject.id) return;
		var entity = pickedObject.id;
		var entityId = String(entity.id);
		if (entityId.indexOf('landingsite') > -1) {
			selectLandingSite(pickedObject.id);
		}else if (entityId.indexOf('landmark') > -1) {
			selectLandmark(pickedObject.id);
		} else {
			if (zoom_level < PARCELZOOMLEVEL) return;
			selectParcel(pickedObject.id);
		}
	}, Cesium.ScreenSpaceEventType.LEFT_CLICK);

	viewer.camera.moveEnd.addEventListener(async function (e) {
		var newTempEntities = [];
		var newTempImageryLayers = [];
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
		if (height) {
			zoom_level = getZoomLevel(height);
			var height_value = height / 1000; //km
			var altitude = height_value > 1 ? parseInt(height_value) : height_value.toFixed(2);
			docId("altitude").style.display = 'block';
			docId("altitude").innerHTML = `Altitude:${numeral(altitude).format('0,0.[00]')}km Zoom:${zoom_level}`;
			
			if(zoom_level > 5){  // show landmarks, hide landing sites
               for(let i=0;i<viewer.entities.values.length;i++){
                   var entity = viewer.entities.values[i];
				   if(entity.billboard){
					   if(String(entity.id).indexOf('landingsite') > -1){
                           entity.show = false;
					   }else{
                           entity.show = true;
					   }
				   }
			   }
			}else{ // show landing sites, hide landmarks
				for(let i=0;i<viewer.entities.values.length;i++){
					var entity = viewer.entities.values[i];
					if(entity.billboard){
						if(String(entity.id).indexOf('landingsite') > -1){
							entity.show = true;
						}else{
							entity.show = false;
						}
					}
				}
			}

			if (zoom_level < PARCELZOOMLEVEL) {
				opacityBarElement.style.display = 'none';
				//viewer.entities.removeAll();
				for (var key in tempEntities) {
					viewer.entities.removeById(key);
				}
				tempEntities = [];
				for (var key in tempImageryLayers) {
					viewer.imageryLayers.remove(tempImageryLayers[key]);
				}
				tempImageryLayers = [];
			} else {
				opacityBarElement.style.display = 'flex';
				var parcel_ids = [];
				parcels.forEach(entity => {
					var entityRectangle = entity.rectangle.coordinates;
					if (rectView.west > 0 && rectView.east < 0) {
						var leftRectView = new Cesium.Rectangle(rectView.west, rectView.south, 180, rectView.north);
						var rightRectView = new Cesium.Rectangle(-180, rectView.south, rectView.east, rectView.north);
						var leftIntersect = Cesium.Rectangle.intersection(leftRectView, entityRectangle);
						var rightIntersect = Cesium.Rectangle.intersection(rightRectView, entityRectangle);
						if (typeof leftIntersect != 'undefined' || typeof rightIntersect != 'undefined') {
							newTempEntities[entity.id] = entity;
							parcel_ids.push(`'${entity.id}'`);
						}
					} else {
						Cesium.Rectangle.intersection(rectView, entityRectangle) // Rectangle|undefined
						var intersect = Cesium.Rectangle.intersection(rectView, entityRectangle);
						if (typeof intersect != 'undefined') {
							newTempEntities[entity.id] = entity;
							parcel_ids.push(`'${entity.id}'`);
						}
					}
				});

				for (var key in tempEntities) {
					if (!newTempEntities[key]) {
						viewer.entities.removeById(key);
					}
				}
				for (var key in newTempEntities) {
					if (!tempEntities[key]) {
						if (selectedParcelEntity && selectedParcelEntity.id == key) {
							viewer.entities.add(selectedParcelEntity);
						} else {
							viewer.entities.add(newTempEntities[key]);
						}
					}
				}

				tempEntities = newTempEntities;

				// check search
				if (searchRectangle) {
					var searchEntity = null;
					var searchCenterCartographic = Cesium.Rectangle.center(searchRectangle);
					for (var key in tempEntities) {
						if (Cesium.Rectangle.contains(tempEntities[key].rectangle.coordinates, searchCenterCartographic)) {
							searchEntity = viewer.entities.getById(key);
							break;
						}
					}
					searchRectangle = null;
					if (searchEntity) {
						selectParcel(searchEntity);
					}
				}

				const formData = new FormData();
				formData.append("action", "get_mars_parcel_ids");
				formData.append("parcel_ids", parcel_ids.join(","));
				fetch(site_resource.ajaxUrl, {
					method: 'POST',
					body: formData
				}).then(response => response.json()).then(result => {
					if (result.length > 0) {
						result.forEach(item => {
							newTempImageryLayers[item.parcel_id] = new Cesium.ImageryLayer(
								new Cesium.SingleTileImageryProvider({
									url: site_resource.uploadUrl + `/mars_parcels/${item.parcel_id}.jpg?${Date.now()}`,
									rectangle: tempEntities[item.parcel_id].rectangle.coordinates
								}),
								{
									alpha: viewModel.alpha,
									show: true
								}
							);
						});

						for (var key in tempImageryLayers) {
							if (!newTempImageryLayers[key]) {
								viewer.imageryLayers.remove(tempImageryLayers[key]);
							}
						}

						for (var key in newTempImageryLayers) {
							if (!tempImageryLayers[key]) {
								viewer.imageryLayers.add(newTempImageryLayers[key]);
							} else {
								newTempImageryLayers[key] = tempImageryLayers[key];
							}
						}

						tempImageryLayers = newTempImageryLayers;

					} else {
						for (var key in tempImageryLayers) {
							viewer.imageryLayers.remove(tempImageryLayers[key]);
						}
						tempImageryLayers = [];
					}
				}).catch(error => {
					console.error('Error:' + error);
				});
			}
		} else {
			docId("altitude").style.display = 'none';
		}
	});

	infoBoxDescriptionElement.addEventListener('click', async function (e) {
		if (selectedParcelEntity) {
			var rectangle = selectedParcelEntity.rectangle.coordinates.getValue();
			var center = Cesium.Rectangle.center(rectangle);
			var lng = Cesium.Math.toDegrees(center.longitude).toFixed(1);
			var lat = Cesium.Math.toDegrees(center.latitude).toFixed(1);
		}
		if (e.target && e.target.id == 'buy-parcel') {
			infoBoxDescriptionElement.innerHTML = [
				`<div class="input-title">Image</div>`,
				`<input type="file" class="cesium-input" id="parcel-image" accept=".png, .jpg, .jpeg" required onChange="parcelImageChange(event)">`,
				`<div class="input-error" id="parcel-image-error"></div>`,
				`<div style="width:100%;"><img id="parcel-image-preview" style="display:none;width:100%;" /></div>`,
				`<div class="input-title">Parcel Name</div>`,
				`<input type="text" class="cesium-input" id="parcel-name" autocomplete="off" required>`,
				`<div class="input-error" id="parcel-name-error"></div>`,
				`<div class="input-title">Description</div>`,
				`<textarea class="cesium-input" id="parcel-description" rows="6"></textarea>`,
				`<div class="input-title">Area Status</div>`,
				`<select id="parcel-status" class="cesium-input">`,
					`<option value="Occupied">Occupied</option>`,
					`<option value="Available">Available</option>`,
					`<option value="Locked">Locked</option>`,
				`</select>`,
				`<div class="input-title">Youtube</div>`,
				`<input type="url" class="cesium-input" id="parcel-youtube" autocomplete="off">`,
				`<div class="input-error" id="parcel-youtube-error"></div>`,
				`<div style="margin-top:20px;text-align:center">`,
					`<button id="buy-parcel-submit" class="cesium-button" style="margin-right:20px">Submit</button>`,
					`<button id="buy-parcel-cancel" class="cesium-button">Cancel</button>`,
				`</div>`,
			].join("");
		}
		if (e.target && e.target.id == 'buy-parcel-cancel') {
			infoBoxDescriptionElement.innerHTML = [
				`<div style="margin-bottom:10px">This parcel is available.</div>`,
				`<div style="margin-bottom:10px">You can <button id="buy-parcel" class="cesium-button">Buy</button> this parcel.</div>`,
				`<div>${Math.abs(lat)}&#176${lat > 0 ? 'N' : 'S'} ${Math.abs(lng)}&#176${lng > 0 ? 'E' : 'W'}</div>`
			].join("");
		}
		if (e.target && e.target.id == 'release-parcel') {
			infoBoxDescriptionElement.innerHTML = [
				`<div style="margin-top:10px;text-align:center;">`,
				`<p>Are you sure to release this parcel ?</p>`,
				`<button id="release-parcel-yes" class="cesium-button" style="margin-right:20px">Yes</button>`,
				`<button id="release-parcel-cancel" class="cesium-button">Cancel</button>`,
				`</div>`,
			].join('');
		}
		if (e.target && e.target.id == 'release-parcel-yes') {
			const formData = new FormData();
			formData.append("action", "remove_mars_parcel");
			formData.append("parcel_id", selectedParcelEntity.id);
			infoBoxDescriptionElement.innerHTML = 'Release <div class="cesium-infoBox-loading"></div>';
			fetch(site_resource.ajaxUrl, {
				method: 'POST',
				body: formData
			}).then(response => response.json()).then(result => {
				if (tempImageryLayers[selectedParcelEntity.id]) {
					viewer.imageryLayers.remove(tempImageryLayers[selectedParcelEntity.id]);
					delete tempImageryLayers[selectedParcelEntity.id];
				}
				infoBoxDescriptionElement.innerHTML = [
					`<div style="margin-bottom:10px">This parcel is available.</div>`,
					`<div style="margin-bottom:10px">You can <button id="buy-parcel" class="cesium-button">Buy</button> this parcel.</div>`,
					`<div>${Math.abs(lat)}&#176${lat > 0 ? 'N' : 'S'} ${Math.abs(lng)}&#176${lng > 0 ? 'E' : 'W'}</div>`
				].join("");
			}).catch(error => {
				//console.error('Error:', error);
				infoBoxDescriptionElement.innerHTML = '<div style="color:red">Release Error</div>';
			});
		}
		if (e.target && (e.target.id == 'release-parcel-cancel' || e.target.id == 'update-parcel-cancel')) {
			infoBoxDescriptionElement.innerHTML = parcelInfoDescription(selectedParcelEntity.properties.getValue());
		}
		if (e.target && e.target.id == 'update-parcel') {
			var obj = selectedParcelEntity.properties.getValue();
			var parcelInfo = obj.parcels[0];
			infoBoxDescriptionElement.innerHTML = [
				`<div class="input-title">Image</div>`,
				`<input type="file" class="cesium-input" id="parcel-image" accept=".png, .jpg, .jpeg" required onChange="parcelImageChange(event)">`,
				`<div class="input-error" id="parcel-image-error"></div>`,
				`<div style="width:100%;"><img id="parcel-image-preview" style="display:none;width:100%;" /></div>`,
				`<div class="input-title">Parcel Name</div>`,
				`<input type="text" class="cesium-input" id="parcel-name" value="${parcelInfo.parcel_name}" autocomplete="off" required>`,
				`<div class="input-error" id="parcel-name-error"></div>`,
				`<div class="input-title">Description</div>`,
				`<textarea class="cesium-input" id="parcel-description" rows="6">${parcelInfo.parcel_description}</textarea>`,
				`<div class="input-title">Area Status</div>`,
				`<select id="parcel-status" class="cesium-input">`,
					`<option value="Occupied">Occupied</option>`,
					`<option value="Available">Available</option>`,
					`<option value="Locked">Locked</option>`,
				`</select>`,
				`<div class="input-title">Youtube</div>`,
				`<input type="url" class="cesium-input" id="parcel-youtube" value="${parcelInfo.parcel_youtube}" autocomplete="off">`,
				`<div class="input-error" id="parcel-youtube-error"></div>`,
				`<div style="margin-top:20px;text-align:center">`,
					`<button id="update-parcel-submit" class="cesium-button" style="margin-right:20px">Submit</button>`,
					`<button id="update-parcel-cancel" class="cesium-button">Cancel</button>`,
				`</div>`,
			].join("");
			docId("parcel-status").value = parcelInfo.parcel_status;
		}
		if (e.target && e.target.id == 'update-parcel-submit') {
			// check validate 
			var checkValidity = parcelSubmitable('update');
            if(!checkValidity) return;
			const formData = new FormData();
			formData.append("action", "update_mars_parcel");
			formData.append("parcel_id", selectedParcelEntity.id);
			if (docId("parcel-image").checkValidity() && cropper) {
				var newImageFile = await compress(selectedParcelEntity.id + '.jpg');
				formData.append("parcel_image", newImageFile);
			}
			formData.append("parcel_name", docId("parcel-name").value);
			formData.append("parcel_description", docId("parcel-description").value);
			formData.append("parcel_status", docId("parcel-status").value);
			formData.append("parcel_youtube", docId("parcel-youtube").value);

			infoBoxDescriptionElement.innerHTML = 'Updating <div class="cesium-infoBox-loading"></div>';
			docId("cesiumContainer").style.pointerEvents = "none";
			fetch(site_resource.ajaxUrl, {
				method: 'POST',
				body: formData
			}).then(response => response.json()).then(result => {
				if (result.parcels.length > 0) {
					viewer.imageryLayers.remove(tempImageryLayers[selectedParcelEntity.id]);
					tempImageryLayers[selectedParcelEntity.id] = new Cesium.ImageryLayer(
						new Cesium.SingleTileImageryProvider({
							url: site_resource.uploadUrl + `/mars_parcels/${selectedParcelEntity.id}.jpg?${Date.now()}`,
							rectangle: selectedParcelEntity.rectangle.coordinates.getValue()
						}),
						{
							alpha: viewModel.alpha,
							show: true
						}
					);
					viewer.imageryLayers.add(tempImageryLayers[selectedParcelEntity.id]);
					selectedParcelEntity.properties = result;
					infoBoxDescriptionElement.innerHTML = parcelInfoDescription(result);
				} else {
					infoBoxDescriptionElement.innerHTML = '<div style="color:red">Submit Error</div>';
				}
				docId("cesiumContainer").style.pointerEvents = "all";
			}).catch(error => {
				//console.error('Error:', error);
				infoBoxDescriptionElement.innerHTML = '<div style="color:red">Submit Error</div>';
			});
		}
		if (e.target && e.target.id == 'buy-parcel-submit') {
			var checkValidity = parcelSubmitable('buy');
            if(!checkValidity) return;
			const formData = new FormData();
			formData.append("action", "add_mars_parcel");
			formData.append("parcel_id", selectedParcelEntity.id);
			var newImageFile = await compress(selectedParcelEntity.id + '.jpg');
			formData.append("parcel_image", newImageFile);
			formData.append("parcel_name", docId("parcel-name").value);
			formData.append("parcel_description", docId("parcel-description").value);
			formData.append("parcel_status", docId("parcel-status").value);
			formData.append("parcel_youtube", docId("parcel-youtube").value);

			infoBoxDescriptionElement.innerHTML = 'Buying <div class="cesium-infoBox-loading"></div>';
			docId("cesiumContainer").style.pointerEvents = "none";
			fetch(site_resource.ajaxUrl, {
				method: 'POST',
				body: formData
			}).then(response => response.json()).then(result => {
				if (result.parcels.length > 0) {
					tempImageryLayers[selectedParcelEntity.id] = new Cesium.ImageryLayer(
						new Cesium.SingleTileImageryProvider({
							url: site_resource.uploadUrl + `/mars_parcels/${selectedParcelEntity.id}.jpg?${Date.now()}`,
							rectangle: selectedParcelEntity.rectangle.coordinates.getValue()
						}),
						{
							alpha: viewModel.alpha,
							show: true
						}
					);
					viewer.imageryLayers.add(tempImageryLayers[selectedParcelEntity.id]);
					selectedParcelEntity.properties = result;
					infoBoxDescriptionElement.innerHTML = parcelInfoDescription(result);
				} else {
					infoBoxDescriptionElement.innerHTML = [
						'<div style="color:red">Submit Error</div>',
						`<div>You can <button id="buy-parcel" class="cesium-button">Buy</button> this parcel again.</div>`,
						`<div>${Math.abs(lat)}&#176${lat > 0 ? 'N' : 'S'} ${Math.abs(lng)}&#176${lng > 0 ? 'E' : 'W'}</div>`
					].join("");
				}
				docId("cesiumContainer").style.pointerEvents = "all";
			}).catch(error => {
				//console.error('Error:', error);
				infoBoxDescriptionElement.innerHTML = [
					'<div style="color:red">Submit Error</div>',
					`<div>You can <button id="buy-parcel" class="cesium-button">Buy</button> this parcel again.</div>`,
					`<div>${Math.abs(lat)}&#176${lat > 0 ? 'N' : 'S'} ${Math.abs(lng)}&#176${lng > 0 ? 'E' : 'W'}</div>`
				].join("");
			});
		}

		// --------------------Layer Add/Update/Remove/Cancel-------------------------------------
		if (e.target && e.target.id == 'add-layer-cancel') {
			infoBoxElement.classList.remove("cesium-infoBox-visible");
		}

		if (e.target && e.target.id == 'add-layer-submit') {
			// check validate 
			var checkValidity = layerSubmitable('add');
			if(!checkValidity) return;
			const formData = new FormData();
			var layer_title = docId("layer-title").value;
			var layer_extent = docId("layer-extent").value;
			formData.append("action", "add_mars_layer");
			formData.append("title", docId("layer-title").value);
			formData.append("image", docId('layer-image').files[0]);
			formData.append("description", docId("layer-description").value);
			formData.append("category", docId("layer-category").value);
			formData.append("sub_category", docId("layer-sub-category").value);
			formData.append("extent", docId("layer-extent").value);
			formData.append("tiles", docId("layer-tiles").value);

			infoBoxDescriptionElement.innerHTML = 'Submit <div class="cesium-infoBox-loading"></div>';
			fetch(site_resource.ajaxUrl, {
				method: 'POST',
				body: formData
			}).then(response => response.json()).then(result => {
				if (result.result == 'success') {
					listLayers.add({ id: 'landingsite-'+result.id, name: layer_title });
					listLayers.sort('name', { order: "asc" });
					// add layer on globe
					var extent = layer_extent.split(",");
					for (let i = 0; i < extent.length; i++) {
						extent[i] = parseFloat(extent[i]);
					}
					var longitude = (extent[0]+extent[2])/2;
					var latitude = (extent[1]+extent[3])/2;
					viewer.entities.add({
						id: `landingsite-${result.id}`,
						name: "Landing Site",
						position: Cesium.Cartesian3.fromDegrees(longitude, latitude, 100, MARSIAU2000),
						billboard: {
							image: site_resource.baseUrl + '/assets/images/flag.png',
							width: 28,
							height: 28,
							horizontalOrigin: Cesium.HorizontalOrigin.CENTER,
							verticalOrigin: Cesium.VerticalOrigin.BOTTOM,
							//heightReference: Cesium.HeightReference.CLAMP_TO_GROUND
						},
						label:{
							text: layer_title,
							font : '14px sans-serif',
							horizontalOrigin : Cesium.HorizontalOrigin.CENTER,
							pixelOffset : new Cesium.Cartesian2(0.0, -36),
						}
					});
					infoBoxElement.classList.remove("cesium-infoBox-visible");
				} else {
					infoBoxDescriptionElement.innerHTML = `<div style="color:red">${result.message}</div>`;
				}
			}).catch(error => {
				console.error('Error:', error);
				infoBoxDescriptionElement.innerHTML = '<div style="color:red">Submit Error</div>';
			});
		}
		if (e.target && e.target.id == 'remove-layer') {
			document.querySelector(".cesium-infoBox-title").innerText = "Remove Layer";
			infoBoxDescriptionElement.innerHTML = [
				`<div style="margin-top:10px;text-align:center;">`,
					`<p>Are you sure to remove this layer ?</p>`,
					`<button id="remove-layer-yes" class="cesium-button" style="margin-right:20px">Yes</button>`,
					`<button id="remove-layer-cancel" class="cesium-button">Cancel</button>`,
				`</div>`,
			].join('');
		}
		if (e.target && (e.target.id == 'update-layer-cancel' || e.target.id == 'remove-layer-cancel')) {
			document.querySelector(".cesium-infoBox-title").innerText = "Layer Information";
			infoBoxDescriptionElement.innerHTML = layerInfoDescription(selectedLayerResponse);
		}
		if (e.target && e.target.id == 'remove-layer-yes') {
			var layer = selectedLayerResponse.layers[0];
			const formData = new FormData();
			formData.append("action", "remove_mars_layer");
			formData.append("id", layer.id);
			formData.append("image", layer.image);
			infoBoxDescriptionElement.innerHTML = 'Remove <div class="cesium-infoBox-loading"></div>';
			fetch(site_resource.ajaxUrl, {
				method: 'POST',
				body: formData
			}).then(response => response.json()).then(result => {
				if (result.result == 'success') {
					listLayers.remove("id", `landingsite-${layer.id}`);
					viewer.entities.removeById(`landingsite-${layer.id}`);
					infoBoxDescriptionElement.innerHTML = '';
					infoBoxElement.classList.remove("cesium-infoBox-visible");
				} else {
					infoBoxDescriptionElement.innerHTML = result.message;
				}
			}).catch(error => {
				//console.error('Error:', error);
				infoBoxDescriptionElement.innerHTML = '<div style="color:red">Remove Error</div>';
			});
		}
		if (e.target && e.target.id == 'update-layer') {
			var layer = selectedLayerResponse.layers[0];
			document.querySelector(".cesium-infoBox-title").innerText = "Update Layer";
			infoBoxDescriptionElement.innerHTML = [
				`<div class="input-title">Title</div>`,
				`<input type="text" class="cesium-input" id="layer-title" value="${layer.title}" autocomplete="off" required>`,
				`<div class="input-error" id="layer-title-error"></div>`,
				`<div class="input-title">Image</div>`,
				`<input type="file" class="cesium-input" id="layer-image" accept=".png, .jpg, .jpeg" required onChange="layerImageChange(event)">`,
				`<div class="image-box"><img id="layer-image-preview" src="${site_resource.uploadUrl}/mars_layers/${layer.image}" /></div>`,
				`<div class="input-title">Description</div>`,
				`<textarea class="cesium-input" id="layer-description" rows="10" required>${layer.description}</textarea>`,
				`<div class="input-error" id="layer-description-error"></div>`,
				`<div class="input-title">Category</div>`,
				`<input type="text" class="cesium-input" id="layer-category" value="${layer.category}" autocomplete="off" required>`,
				`<div class="input-title">Sub Category</div>`,
				`<input type="text" class="cesium-input" id="layer-sub-category" value="${layer.sub_category}" autocomplete="off" required>`,
				`<div class="input-title">Extent</div>`,
				`<textarea class="cesium-input" id="layer-extent" rows="4" placeholder="W, S, E, N" required>${layer.extent}</textarea>`,
				`<div class="input-error" id="layer-extent-error"></div>`,
				`<div class="input-title">Tiles</div>`,
				`<textarea class="cesium-input" id="layer-tiles" rows="4" placeholder="id1, id2, ..." required>${layer.tiles}</textarea>`,
				`<div style="margin-top:20px;text-align:center">`,
					`<button id="update-layer-submit" class="cesium-button" style="margin-right:20px">Submit</button>`,
					`<button id="update-layer-cancel" class="cesium-button">Cancel</button>`,
				`</div>`,
			].join("");
		}
		
		if (e.target && e.target.id == 'update-layer-submit') {
			var checkValidity = layerSubmitable('update');
			if(!checkValidity) return;
			var layer = selectedLayerResponse.layers[0];
			const formData = new FormData();
			var layer_title = docId("layer-title").value;
			var layer_extent = docId("layer-extent").value;
			formData.append("action", "update_mars_layer");
			formData.append("id", layer.id);
			formData.append("title", docId("layer-title").value);
			formData.append("old_image", layer.image);
			if (docId("layer-image").checkValidity()) {
				formData.append("image", docId('layer-image').files[0]);
			}
			formData.append("description", docId("layer-description").value);
			formData.append("category", docId("layer-category").value);
			formData.append("sub_category", docId("layer-sub-category").value);
			formData.append("extent", docId("layer-extent").value);
			formData.append("tiles", docId("layer-tiles").value);

			infoBoxDescriptionElement.innerHTML = 'Submit <div class="cesium-infoBox-loading"></div>';
			fetch(site_resource.ajaxUrl, {
				method: 'POST',
				body: formData
			}).then(response => response.json()).then(result => {
				if (result.result == 'success') {
					selectedLayerResponse = result;
					infoBoxDescriptionElement.innerHTML = layerInfoDescription(result);
					var item = listLayers.get('id', 'landingsite-'+layer.id)[0];
					item.values({ name: layer_title });
					listLayers.sort('name', { order: "asc" });
					// update layer on the map
					var extent = layer_extent.split(",");
					for (let i = 0; i < extent.length; i++) {
						extent[i] = parseFloat(extent[i]);
					}
					var longitude = (extent[0]+extent[2])/2;
					var latitude = (extent[1]+extent[3])/2;
					if(selectedMarkerEntity){
						selectedMarkerEntity.position = Cesium.Cartesian3.fromDegrees(longitude, latitude, 100, MARSIAU2000);
						selectedMarkerEntity.label.text = layer_title;
					}
				} else {
					infoBoxDescriptionElement.innerHTML = `<div style="color:red">${result.message}</div>`;
				}
			}).catch(error => {
				console.error('Error:', error);
				infoBoxDescriptionElement.innerHTML = '<div style="color:red">Submit Error</div>';
			});
		}
		// --------------------Landmark Add/Update/Remove/Cancel-------------------------------------
		if (e.target && e.target.id == 'add-landmark-cancel') {
			infoBoxElement.classList.remove("cesium-infoBox-visible");
		}
		if (e.target && e.target.id == 'add-landmark-submit') {
			var checkValidity = landmarkSubmitable('add');
			if (!checkValidity) return;
			const formData = new FormData();
			var layer = selectedLayerResponse.layers[0];
			var landmark_title = docId("landmark-title").value;
			var longitude = parseFloat(docId("landmark-longitude").value);
			var latitude = parseFloat(docId("landmark-latitude").value);

			formData.append("action", "add_mars_landmark");
			formData.append("layer_id", layer.id);
			formData.append("title", landmark_title);
			var files = docId('landmark-image').files;
			var imageTitles = [], descriptions = [];
			for(let i=0;i<files.length;i++){
				formData.append("images[]", files[i]);
				imageTitles.push(docId(`image-title-${i}`).value);
				descriptions.push(docId(`image-description-${i}`).value);
			}
			formData.append("image_title", JSON.stringify(imageTitles));
			formData.append("description", JSON.stringify(descriptions));
			formData.append("longitude", docId("landmark-longitude").value);
			formData.append("latitude", docId("landmark-latitude").value);

			infoBoxDescriptionElement.innerHTML = 'Submit <div class="cesium-infoBox-loading"></div>';
			fetch(site_resource.ajaxUrl, {
				method: 'POST',
				body: formData
			}).then(response => response.json()).then(result => {
				if (result.result == 'success') {
					// add landmark in listings
					listLandmarks.add({
						id: 'landmark-'+result.id,
						name: landmark_title
					});
					listLandmarks.sort('name', { order: "asc" });
					// add landmark on globe
					viewer.entities.add({
						id: `landmark-${result.id}`,
						name: "Landmark Information",
						position: Cesium.Cartesian3.fromDegrees(longitude, latitude, 100, MARSIAU2000),
						billboard: {
							image: site_resource.baseUrl + '/assets/images/landmark.png',
							width: 28,
							height: 28,
							horizontalOrigin: Cesium.HorizontalOrigin.CENTER,
							verticalOrigin: Cesium.VerticalOrigin.BOTTOM,
							//heightReference: Cesium.HeightReference.CLAMP_TO_GROUND
						},
						label:{
							text: landmark_title,
							font : '14px sans-serif',
							horizontalOrigin : Cesium.HorizontalOrigin.CENTER,
							pixelOffset : new Cesium.Cartesian2(0.0, -36),
						}
					});
					infoBoxElement.classList.remove("cesium-infoBox-visible");
				} else {
					infoBoxDescriptionElement.innerHTML = `<div style="color:red">${result.message}</div>`;
				}
			}).catch(error => {
				console.error('Error:', error);
				infoBoxDescriptionElement.innerHTML = '<div style="color:red">Submit Error</div>';
			});
		}
		if (e.target && e.target.id == 'remove-landmark') {
			document.querySelector(".cesium-infoBox-title").innerText = "Remove Landmark";
			infoBoxDescriptionElement.innerHTML = [
				`<div style="margin-top:10px;text-align:center;">`,
					`<p>Are you sure to remove this landmark ?</p>`,
					`<button id="remove-landmark-yes" class="cesium-button" style="margin-right:20px">Yes</button>`,
					`<button id="remove-landmark-cancel" class="cesium-button">Cancel</button>`,
				`</div>`,
			].join('');
		}
		if (e.target && (e.target.id == 'remove-landmark-cancel' || e.target.id == 'update-landmark-cancel')) {
			document.querySelector(".cesium-infoBox-title").innerText = "Landmark Information";
			infoBoxDescriptionElement.innerHTML = landmarkInfoDescription(selectedLandmarkResponse);
		}
		if (e.target && e.target.id == 'remove-landmark-yes') {
			var landmark = selectedLandmarkResponse.landmarks[0];
			const formData = new FormData();
			formData.append("action", "remove_mars_landmark");
			formData.append("id", landmark.id);
			formData.append("image", landmark.image);
			infoBoxDescriptionElement.innerHTML = 'Remove <div class="cesium-infoBox-loading"></div>';
			fetch(site_resource.ajaxUrl, {
				method: 'POST',
				body: formData
			}).then(response => response.json()).then(result => {
				if (result.result == 'success') {
					listLandmarks.remove("id", `landmark-${landmark.id}`);
					viewer.entities.removeById(`landmark-${landmark.id}`);
					infoBoxDescriptionElement.innerHTML = '';
					infoBoxElement.classList.remove("cesium-infoBox-visible");
				} else {
					infoBoxDescriptionElement.innerHTML = result.message;
				}
			}).catch(error => {
				//console.error('Error:', error);
				infoBoxDescriptionElement.innerHTML = '<div style="color:red">Remove Error</div>';
			});
		}
		if (e.target && e.target.id == 'update-landmark') {
			var landmark = selectedLandmarkResponse.landmarks[0];
			document.querySelector(".cesium-infoBox-title").innerText = "Update Landmark";
			var images = JSON.parse(landmark.image);
	        var imageTitles = JSON.parse(landmark.image_title);
	        var imageDescriptions = JSON.parse(landmark.description);
			html_arr = [
				`<div class="input-title">Title</div>`,
				`<input type="text" class="cesium-input" id="landmark-title" value="${landmark.title}" autocomplete="off" required>`,
				`<div class="input-error" id="landmark-title-error"></div>`,
				`<div class="input-title">Image</div>`,
				`<input type="file" class="cesium-input" id="landmark-image" accept=".png, .jpg, .jpeg" multiple required onChange="landmarkImageChange(event)">`,
				`<div class="input-error" id="landmark-image-error"></div>`,
				`<div id="image-items">`
			];
			for(let i=0;i<images.length;i++){
				html_arr = html_arr.concat([
					`<div class="image-box">`,
						`<img src="${site_resource.uploadUrl}/mars_landmarks/${images[i]}" />`,
					`</div>`,
					`<div class="input-title">Image Title</div>`,
					`<textarea class="cesium-input" id="image-title-${i}" rows="3">${imageTitles[i]}</textarea>`,
					`<div class="input-title">Description</div>`,
					`<textarea class="cesium-input" id="image-description-${i}" rows="10">${imageDescriptions[i]}</textarea>`
				]);
			}
			html_arr = html_arr.concat([
				`</div>`, // end image-items
				`<div class="input-title">Longitude</div>`,
				`<input type="text" class="cesium-input" id="landmark-longitude" value="${landmark.longitude}" autocomplete="off" required>`,
				`<div class="input-error" id="landmark-longitude-error"></div>`,
				`<div class="input-title">Latitude</div>`,
				`<input type="text" class="cesium-input" id="landmark-latitude" value="${landmark.latitude}" autocomplete="off" required>`,
				`<div class="input-error" id="landmark-latitude-error"></div>`,
				`<div style="margin-top:20px;text-align:center;">`,
					`<button id="update-landmark-submit" class="cesium-button" style="margin-right:20px">Submit</button>`,
					`<button id="remove-landmark-cancel" class="cesium-button">Cancel</button>`,
				`</div>`
			]);
			infoBoxDescriptionElement.innerHTML = html_arr.join('');
		}
		
		if (e.target && e.target.id == 'update-landmark-submit') {

			var checkValidity = landmarkSubmitable('update');
			if (!checkValidity) return;
			
			const formData = new FormData();
			var landmark = selectedLandmarkResponse.landmarks[0];
			var landmark_title = docId("landmark-title").value;
			var longitude = parseFloat(docId("landmark-longitude").value);
			var latitude = parseFloat(docId("landmark-latitude").value);

			formData.append("action", "update_mars_landmark");
			formData.append("id", landmark.id);
			formData.append("title", landmark_title);
			formData.append("old_image", landmark.image);
			var imageTitles = [], imageDescriptions = [];
			if (docId("landmark-image").checkValidity()) {
				var files = docId("landmark-image").files;
				for(let i=0;i<files.length;i++){
					formData.append("images[]", files[i]);
					imageTitles.push(docId(`image-title-${i}`).value);
					imageDescriptions.push(docId(`image-description-${i}`).value);
				}
			}else{
				var images = JSON.parse(landmark.image);
				for(let i=0;i<images.length;i++){
					imageTitles.push(docId(`image-title-${i}`).value);
					imageDescriptions.push(docId(`image-description-${i}`).value);
				}
			}
			formData.append("image_title", JSON.stringify(imageTitles));
			formData.append("description", JSON.stringify(imageDescriptions));
			formData.append("longitude", docId("landmark-longitude").value);
			formData.append("latitude", docId("landmark-latitude").value);

			infoBoxDescriptionElement.innerHTML = 'Submit <div class="cesium-infoBox-loading"></div>';
			fetch(site_resource.ajaxUrl, {
				method: 'POST',
				body: formData
			}).then(response => response.json()).then(result => {
				if(result.result == 'success'){
					selectedLandmarkResponse = result;
					infoBoxDescriptionElement.innerHTML = landmarkInfoDescription(result);
					// update landmark in listings
					var item = listLandmarks.get('id', 'landmark-'+landmark.id)[0];
					item.values({ name: landmark_title });
					listLandmarks.sort('name', { order: "asc" });
					// update landmark on the map
					if(selectedMarkerEntity){
						selectedMarkerEntity.position = Cesium.Cartesian3.fromDegrees(longitude, latitude, 100, MARSIAU2000);
						selectedMarkerEntity.label.text = landmark_title;
					}
				}else{
					infoBoxDescriptionElement.innerHTML = `<div style="color:red">${result.message}</div>`;
				}
			}).catch(error => {
				console.error('Error:', error);
				infoBoxDescriptionElement.innerHTML = '<div style="color:red">Submit Error</div>';
			});
		}
	});
}

function getParcels(n) {
	var result = [];
	// drawing grid on globe
	var ds = 4 * Math.PI * R * R / n; // area size of a parcel
	var dy = Math.sqrt(ds); // dy size of a parcel
	dlat0 = Math.acos(1 - ds / (2 * Math.PI * R * R)) * 180 / Math.PI; // delta lat of a parcel of pole, this is a circle
	var dlat = (180 - 2 * dlat0) / (Math.PI * R - 2 * R * dlat0 * Math.PI / 180) * dy;

	var count = 0;
	count++
	// north pole

	result.push({
		id: count,
		name: `ID: ${count}`,
		rectangle: {
			coordinates: Cesium.Rectangle.fromDegrees(-180, 90 - dlat0, 180, 90),
			fill: true,
			material: Cesium.Color.WHITE.withAlpha(0.01),
			height: 0,
			outline: true, // height must be set for outline to display
			outlineColor: Cesium.Color.BLACK,
		}
	});

	var lat = 90 - dlat0;
	while (lat > -90 + dlat0) {
		var lat_s = get_surface_area(-180, 180, lat - dlat, lat); // area of a lat band
		var cols = Math.round(lat_s / ds); // parcel count of a lat band

		var lat_1 = Math.asin(Math.sin(lat * Math.PI / 180) - ds * cols / (2 * Math.PI * R * R)) * 180 / Math.PI; // adjust next lat value
		//var lat_1 = lat-dlat;

		if (lat_1 < -90 + dlat0 || lat_1 - dlat < -90 + dlat0) {
			lat_1 = -90 + dlat0;
			lat_s = get_surface_area(-180, 180, lat_1, lat); // area of a lat band
			cols = Math.round(lat_s / ds); // parcel count of a lat band
		}

		var dlng = 360 / cols;
		for (var j = 0; j < cols; j++) {
			var lng = -180 + j * dlng;
			var e_lng = lng + dlng;
			if (e_lng > 180) {
				e_lng = 180;
			}
			count++;
			result.push({
				id: count,
				name: `ID: ${count}`,
				rectangle: {
					coordinates: Cesium.Rectangle.fromDegrees(lng, lat_1, e_lng, lat),
					fill: true,
					material: Cesium.Color.WHITE.withAlpha(0.01),
					height: 0,
					outline: true, // height must be set for outline to display
					outlineColor: Cesium.Color.BLACK,
				}
			});
		}
		lat = lat_1;
	}
	count++
	// south pole
	result.push({
		id: count,
		name: `ID: ${count}`,
		rectangle: {
			coordinates: Cesium.Rectangle.fromDegrees(-180, -90, 180, -90 + dlat0),
			fill: true,
			material: Cesium.Color.WHITE.withAlpha(0.01),
			height: 0,
			outline: true, // height must be set for outline to display
			outlineColor: Cesium.Color.BLACK,
		}
	});

	return result;
}

function get_surface_area(lng1, lng2, lat1, lat2) {
	var lng_1 = lng1 * Math.PI / 180;
	var lng_2 = lng2 * Math.PI / 180;
	var lat_1 = lat1 * Math.PI / 180;
	var lat_2 = lat2 * Math.PI / 180;
	return R * R * (lng_2 - lng_1) * (Math.sin(lat_2) - Math.sin(lat_1));
}

function getZoomLevel(altitude_value) {
	return Math.round(Math.log(2 * Math.PI * R / altitude_value) / Math.log(2));
}

function compress(newFileName) {
	return new Promise(resolve => {
		var canvas = cropper.getCroppedCanvas({
			width: 256,
			height: 256
		});
		canvas.toBlob(function (blob) {
			const file = new File([blob], newFileName, {
				type: 'image/jpeg',
				lastModified: Date.now()
			});
			resolve(file);
		}, 'image/jpeg', 0.7);
	});
}

function docId(id) {
	return document.getElementById(id);
}

function selectLandingSite(entity){
	if(selectedMarkerEntity){
		selectedMarkerEntity.billboard.width = 28;
		selectedMarkerEntity.billboard.height = 28;
		selectedMarkerEntity.label.pixelOffset = new Cesium.Cartesian2(0.0, -36);
	}
	selectedMarkerEntity = entity;
	selectedMarkerEntity.billboard.width = 36;
	selectedMarkerEntity.billboard.height = 36;
	selectedMarkerEntity.label.pixelOffset = new Cesium.Cartesian2(0.0, -48);
	viewer.selectedEntity = selectedMarkerEntity;
	if (selectedParcelEntity) {
		selectedParcelEntity.rectangle.extrudedHeight = 0;
		selectedParcelEntity.rectangle.outlineColor = Cesium.Color.BLACK;
		selectedParcelEntity = null;
	}
	
	var activeElements = document.querySelectorAll("#list-layers li.active");
	activeElements.forEach(element => {
		element.classList.remove('active');
	});
	var selectedElement = document.querySelector(`#list-layers [data-id=${entity.id}]`);
	if(selectedElement){
		selectedElement.classList.add('active');
		//docId("list-layers").scrollTop = selectedElement.offsetTop;
	}
	// remove landmarks from listings
	listLandmarks.clear();
	// remove landing site imagery layers

	// remove landmarks on the map
	var entities = viewer.entities.values;
	for(let i=0;i<entities.length;i++){
		if(entities[i].billboard && String(entities[i].id).indexOf('landmark')>-1){
			viewer.entities.remove(entities[i]);
			i--;
		}
	}

	var id = String(entity.id).split('-')[1];
	infoBoxElement.classList.add("cesium-infoBox-visible");
	document.querySelector(".cesium-infoBox-title").innerText = "Landing Site";
	infoBoxDescriptionElement.innerHTML = 'Loading <div class="cesium-infoBox-loading"></div>';
	const formData = new FormData();
	formData.append("action", "get_mars_layer");
	formData.append("id", id);
	fetch(site_resource.ajaxUrl, {
		method: 'POST',
		body: formData
	}).then(response => response.json()).then(result => {
		selectedLayerResponse = result;
		infoBoxDescriptionElement.innerHTML = layerInfoDescription(result);
		/*
		var layer = result.layers[0];
		var extent = layer.extent.split(",");
		for (let i = 0; i < extent.length; i++) {
			extent[i] = parseFloat(extent[i]);
		}
		var tiles = layer.tiles.split(",");
		for(let i=0;i<tiles.length;i++){
			var imageryProvider = new Cesium.WebMapTileServiceImageryProvider({
				//url: `https://api.nasa.gov/mars-wmts/catalog/${tiles[i]}/1.0.0/{Style}/{TileMatrixSet}/{TileMatrix}/{TileRow}/{TileCol}.png`,
				url: `https://api.allorigins.win/raw?url=https://api.nasa.gov/mars-wmts/catalog/${tiles[i]}/1.0.0/{Style}/{TileMatrixSet}/{TileMatrix}/{TileRow}/{TileCol}.png`,
				layer : tiles[i],
				format : 'image/png',
				tilingScheme: new Cesium.GeographicTilingScheme({ellipsoid: MARSIAU2000, rectangle: Cesium.Rectangle.fromDegrees(extent[0],extent[1],extent[2],extent[3])}),
				ellipsoid: MARSIAU2000,
				//maximumLevel: 9,
				style : 'default',
				tileMatrixSetID : 'default028mm',
			});
			viewer.imageryLayers.addImageryProvider(imageryProvider);
			//var imageryLayer = new Cesium.ImageryLayer(imageryProvider);
		}
       */
		var layerLandmarks = result.landmarks;
		layerLandmarks.forEach(item => {
			listLandmarks.add({
				id: 'landmark-'+item.id,
				name: item.title
			});
			var lng = parseFloat(item.longitude);
			var lat = parseFloat(item.latitude);
			viewer.entities.add({
				id: `landmark-${item.id}`,
				name: "Landmark Information",
				show:false,
				position: Cesium.Cartesian3.fromDegrees(lng, lat, 100, MARSIAU2000),
				billboard: {
					image: site_resource.baseUrl + '/assets/images/landmark.png',
					width: 28,
					height: 28,
					horizontalOrigin: Cesium.HorizontalOrigin.CENTER,
					verticalOrigin: Cesium.VerticalOrigin.BOTTOM,
					//heightReference: Cesium.HeightReference.CLAMP_TO_GROUND
				},
				label:{
					text: item.title,
					font : '14px sans-serif',
					horizontalOrigin : Cesium.HorizontalOrigin.CENTER,
					pixelOffset : new Cesium.Cartesian2(0.0, -36),
				}
			});
		});
	}).catch(error => {
		console.error('Error:', error);
	});
}

function selectLandmark(entity) {
	if(selectedMarkerEntity){
		selectedMarkerEntity.billboard.width = 28;
		selectedMarkerEntity.billboard.height = 28;
		selectedMarkerEntity.label.pixelOffset = new Cesium.Cartesian2(0.0, -36);
	}
	selectedMarkerEntity = entity;
	selectedMarkerEntity.billboard.width = 36;
	selectedMarkerEntity.billboard.height = 36;
	selectedMarkerEntity.label.pixelOffset = new Cesium.Cartesian2(0.0, -48);
	viewer.selectedEntity = selectedMarkerEntity;
	if (selectedParcelEntity) {
		selectedParcelEntity.rectangle.extrudedHeight = 0;
		selectedParcelEntity.rectangle.outlineColor = Cesium.Color.BLACK;
		selectedParcelEntity = null;
	}

	var activeElements = document.querySelectorAll("#list-landmarks li.active");
	activeElements.forEach(element => {
		element.classList.remove('active');
	});
	var selectedElement = document.querySelector(`#list-landmarks [data-id=${entity.id}]`);
	if(selectedElement){
		selectedElement.classList.add('active');
		//docId("list-landmarks").scrollTop = selectedElement.offsetTop;
	}

	infoBoxElement.classList.add("cesium-infoBox-visible");
	infoBoxDescriptionElement.innerHTML = 'Loading <div class="cesium-infoBox-loading"></div>';
	var landmark_id = selectedMarkerEntity.id.split("-")[1];
	const formData = new FormData();
	formData.append("action", "get_mars_landmark");
	formData.append("id", landmark_id);
	fetch(site_resource.ajaxUrl, {
		method: 'POST',
		body: formData
	}).then(response => response.json()).then(result => {
		if (result.result == 'success') {
			selectedLandmarkResponse = result;
			infoBoxDescriptionElement.innerHTML = landmarkInfoDescription(result);
		} else {
			infoBoxDescriptionElement.innerHTML = 'Error Landmark Info';
		}
	}).catch(error => {
		console.error('Error:', error);
		infoBoxDescriptionElement.innerHTML = 'Error Landmark Info';
	});
}

function selectParcel(entity) {
	if (selectedParcelEntity) {
		selectedParcelEntity.rectangle.extrudedHeight = 0;
		selectedParcelEntity.rectangle.outlineColor = Cesium.Color.BLACK;
		//selectedParcelEntity.rectangle.material = Cesium.Color.WHITE.withAlpha(0.01);
	}
	if(selectedMarkerEntity){
		selectedMarkerEntity.billboard.width = 28;
		selectedMarkerEntity.billboard.height = 28;
		selectedMarkerEntity.label.pixelOffset = new Cesium.Cartesian2(0.0, -36);
		selectedMarkerEntity = null;
	}
	selectedParcelEntity = entity;
	selectedParcelEntity.rectangle.extrudedHeight = 100;
	selectedParcelEntity.rectangle.outlineColor = Cesium.Color.YELLOW;
	//selectedParcelEntity.rectangle.material = Cesium.Color.YELLOW.withAlpha(0.25);

	viewer.selectedEntity = selectedParcelEntity;
	infoBoxDescriptionElement.innerHTML = 'Loading <div class="cesium-infoBox-loading"></div>';
	const formData = new FormData();
	formData.append("action", "get_mars_parcel");
	formData.append("parcel_id", selectedParcelEntity.id);
	fetch(site_resource.ajaxUrl, {
		method: 'POST',
		body: formData
	}).then(response => response.json()).then(result => {
		selectedParcelEntity.properties = result;
		infoBoxDescriptionElement.innerHTML = parcelInfoDescription(result);
	}).catch(error => {
		console.error('Error:', error);
		infoBoxDescriptionElement.innerHTML = 'Error Parcel Info';
	});
}

function parcelInfoDescription(response) {
	var rectangle = selectedParcelEntity.rectangle.coordinates.getValue();
	var center = Cesium.Rectangle.center(rectangle);
	var lng = Cesium.Math.toDegrees(center.longitude).toFixed(1);
	var lat = Cesium.Math.toDegrees(center.latitude).toFixed(1);
	if (response.parcels.length > 0) {
		var parcelInfo = response.parcels[0];
		var country = response.country;
		var social_media = response.social_media;
		var html_arr = [
			'<table class="cesium-infoBox-defaultTable"><tbody>',
			`<tr><th>Coordinates</th><td>${Math.abs(lat)}&#176${lat > 0 ? 'N' : 'S'} ${Math.abs(lng)}&#176${lng > 0 ? 'E' : 'W'}</td></tr>`,
			`<tr><th>Parcel Name</th><td>${parcelInfo.parcel_name}</td></tr>`,
			`<tr><th>Description</th><td>${parcelInfo.parcel_description}</td></tr>`,
			`<tr><th>Area Status</th><td>${parcelInfo.parcel_status}</td></tr>`,
			`<tr><th>Created</th><td>${parcelInfo.created_datetime}</td></tr>`,
			`<tr><th>Updated</th><td>${parcelInfo.updated_datetime}</td></tr>`,
			`<tr><th>User Name</th><td><a href="${site_resource.siteUrl}/profile/${parcelInfo.user_name}" target="_blank">${parcelInfo.user_name}</a></td></tr>`,
			`<tr><th>Country</th><td>${country}</td></tr>`,
			`<tr><th>Website</th><td><a href="${parcelInfo.user_url}" target="_blank">${parcelInfo.user_url}</a></td></tr>`,
			`<tr><th>Social Links</th><td><div class="social-icons">`
		];
		//youtube, facebook, twitter, linkedin, googleplus, instagram, skype
		if (social_media.youtube) {
			html_arr.push(`<a href="${social_media.youtube}" class="fa fa-youtube" target="_blank" title="youtube"></a>`);
		}
		if (social_media.facebook) {
			html_arr.push(`<a href="${social_media.facebook}" class="fa fa-facebook" target="_blank" title="facebook"></a>`);
		}
		if (social_media.twitter) {
			html_arr.push(`<a href="${social_media.twitter}" class="fa fa-twitter" target="_blank" title="twitter"></a>`);
		}
		if (social_media.linkedin) {
			html_arr.push(`<a href="${social_media.linkedin}" class="fa fa-linkedin" target="_blank" title="linkedin"></a>`);
		}
		/*
		if(social_media.googleplus){
			html_arr.push(`<a href="${social_media.googleplus}" class="fa fa-google-plus" target="_blank" title="google plus"></a>`);
		}
		*/
		if (social_media.instagram) {
			html_arr.push(`<a href="${social_media.instagram}" class="fa fa-instagram" target="_blank" title="instagram"></a>`);
		}
		html_arr.push('</div></td></tr>');

		if (parcelInfo.parcel_youtube) {
			var youtube_video_id = getYoutubeVideoId(parcelInfo.parcel_youtube);
			if (youtube_video_id) {
				html_arr = html_arr.concat([
					`<tr><td colspan="2" style="padding:0;line-height:0">`,
					`<iframe width="100%" height="200px" frameborder="0" src="https://www.youtube.com/embed/${youtube_video_id}" allowfullscreen></iframe>`,
					`</td></tr>`
				]);
			}
		}

		html_arr.push('</tbody></table>');

		if (response.client_user_id == parcelInfo.parcel_user_id) {
			html_arr = html_arr.concat([
				`<div style="margin-top:20px;text-align:center;">`,
					`<button id="update-parcel" class="cesium-button" style="margin-right:20px">Update</button>`,
					`<button id="release-parcel" class="cesium-button">Release</button>`,
				`</div>`
			]);
		} else {
			html_arr = html_arr.concat([
				`<div style="margin-top:20px;text-align:center">`,
			    	`This parcel is private. You can't buy this parcel`,
				`</div>`
			]);
		}

		return html_arr.join('');
	} else {
		if (response.client_user_id > 0) {
			return [
				`<div style="margin-bottom:10px">This parcel is available.</div>`,
				`<div style="margin-bottom:10px">You can <button id="buy-parcel" class="cesium-button">Buy</button> this parcel.</div>`,
				`<div>${Math.abs(lat)}&#176${lat > 0 ? 'N' : 'S'} ${Math.abs(lng)}&#176${lng > 0 ? 'E' : 'W'}</div>`
			].join("");
		} else {
			return [
				`<div style="margin-bottom:10px">This parcel is available.</div>`,
				`<div style="margin-bottom:10px">Please login to buy this parcel.</div>`,
				`<div>${Math.abs(lat)}&#176${lat > 0 ? 'N' : 'S'} ${Math.abs(lng)}&#176${lng > 0 ? 'E' : 'W'}</div>`
			].join("");
		}
	}
}

function getYoutubeVideoId(url) {
	var regExp = /^https?\:\/\/(?:www\.youtube(?:\-nocookie)?\.com\/|m\.youtube\.com\/|youtube\.com\/)?(?:ytscreeningroom\?vi?=|youtu\.be\/|vi?\/|user\/.+\/u\/\w{1,2}\/|embed\/|watch\?(?:.*\&)?vi?=|\&vi?=|\?(?:.*\&)?vi?=)([^#\&\?\n\/<>"']*)/i;
	var match = url.match(regExp);
	return (match && match[1].length == 11) ? match[1] : false;
}

function validateYouTubeUrl(url) {
	if (url) {
		var regExp = /^(?:https?:\/\/)?(?:m\.|www\.)?(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|watch\?.+&v=))((\w|-){11})(?:\S+)?$/;
		if (url.match(regExp)) {
			return true;
		}
	}
	return false;
}

function parcelImageChange(event) {
	var input = event.target;
	if (input.files && input.files[0]) {
		var reader = new FileReader();
		reader.onload = function (e) {
			var img = docId('parcel-image-preview');
			img.src = reader.result;
			img.style.display = 'block';
			if (cropper) {
				cropper.destroy();
			}
			cropper = new Cropper(img, {
				aspectRatio: 1,
				autoCropArea: 1, // default 0.8
				dragMode: 'move',
				viewMode: 3
			});
		};
		reader.readAsDataURL(input.files[0]);
	}
}

function layerImageChange(event) {
	var input = event.target;
	if (input.files && input.files[0]) {
		var reader = new FileReader();
		reader.onload = function (e) {
			var img = docId('layer-image-preview');
			img.src = reader.result;
			img.style.display = 'flex';
		};
		reader.readAsDataURL(input.files[0]);
	}
}

async function landmarkImageChange(event) {
	var input = event.target;
	let imageItems = docId("image-items");
	imageItems.innerHTML = '';
	docId('landmark-image-error').style.display = 'none';
	if(input.files.length > 4){
		input.value = null;
		docId('landmark-image-error').style.display = 'block';
		docId('landmark-image-error').innerText = 'You can upload max 4 files';
		return;
	}
	for(let i=0;i<input.files.length;i++){
		await appendImageItem(imageItems, input.files[i], i);
	}
}

function appendImageItem(imageItems, file, index){
    return new Promise(function(resolve, reject){
        var reader = new FileReader();
        reader.onload = function(e){
            var imageBox = document.createElement('div');
			imageBox.className='image-box';
			var img = new Image();
			img.src    = this.result;
			imageBox.appendChild(img);
			imageItems.appendChild(imageBox);
			
			var label = document.createElement('div');
			label.className = 'input-title';
			label.innerText = 'Image Title';
			imageItems.appendChild(label);
			
			var textArea = document.createElement('textarea');
			textArea.className = 'cesium-input';
			textArea.id = `image-title-${index}`;
			textArea.rows = 3;
			imageItems.appendChild(textArea);

			label = document.createElement('div');
			label.className = 'input-title';
			label.innerText = 'Description';
			imageItems.appendChild(label);
			
			textArea = document.createElement('textarea');
			textArea.className = 'cesium-input';
			textArea.id = `image-description-${index}`;
			textArea.rows = 10;
			imageItems.appendChild(textArea);
			resolve();
        }
        reader.onerror = function(error){
            reject(error);
        }
        reader.readAsDataURL(file);
    });
}


docId("sidebar-menu-button").addEventListener("click", event => {
	docId("sidebar").style.display = 'block';
	docId("sidebar-menu-button").style.display = 'none';
});

docId("sidebar-close-button").addEventListener("click", event => {
	docId("sidebar").style.display = 'none';
	docId("sidebar-menu-button").style.display = 'block';
});

if(docId("add-layer-button") && docId("add-landmark-button")){
	docId("add-layer-button").addEventListener("click", function () {
		infoBoxDescriptionElement.innerHTML = [
			`<div class="input-title">Title</div>`,
			`<input type="text" class="cesium-input" id="layer-title" autocomplete="off" required>`,
			`<div class="input-error" id="layer-title-error"></div>`,
			`<div class="input-title">Image</div>`,
			`<input type="file" class="cesium-input" id="layer-image" accept=".png, .jpg, .jpeg" required onChange="layerImageChange(event)">`,
			`<div class="input-error" id="layer-image-error"></div>`,
			`<div class="image-box"><img id="layer-image-preview" style="display:none;" /></div>`,
			`<div class="input-title">Description</div>`,
			`<textarea class="cesium-input" id="layer-description" rows="10" required></textarea>`,
			`<div class="input-error" id="layer-description-error"></div>`,
			`<div class="input-title">Category</div>`,
			`<input type="text" class="cesium-input" id="layer-category" autocomplete="off" required>`,
			`<div class="input-title">Sub Category</div>`,
			`<input type="text" class="cesium-input" id="layer-sub-category" autocomplete="off" required>`,
			`<div class="input-title">Extent</div>`,
			`<textarea class="cesium-input" id="layer-extent" rows="4" placeholder="W, S, E, N" required></textarea>`,
			`<div class="input-error" id="layer-extent-error"></div>`,
			`<div class="input-title">Tiles</div>`,
			`<textarea class="cesium-input" id="layer-tiles" rows="4" placeholder="id_1, id_2, ..." required></textarea>`,
			`<div style="margin-top:20px;text-align:center">`,
				`<button id="add-layer-submit" class="cesium-button" style="margin-right:20px">Submit</button>`,
				`<button id="add-layer-cancel" class="cesium-button">Cancel</button>`,
			`</div>`,
		].join("");
		document.querySelector(".cesium-infoBox-title").innerText = "Add Layer";
		infoBoxElement.classList.add("cesium-infoBox-visible");
	});
	
	docId("add-landmark-button").addEventListener("click", function () {
		if (!selectedLayerResponse) return;
		infoBoxDescriptionElement.innerHTML = [
			`<div class="input-title">Title</div>`,
			`<input type="text" class="cesium-input" id="landmark-title" autocomplete="off" required>`,
			`<div class="input-error" id="landmark-title-error"></div>`,
			`<div class="input-title">Images</div>`,
			`<input type="file" class="cesium-input" id="landmark-image" accept=".png, .jpg, .jpeg" multiple required onChange="landmarkImageChange(event)">`,
			`<div class="input-error" id="landmark-image-error"></div>`,
			`<div id="image-items"></div>`,
			`<div class="input-title">Longitude</div>`,
			`<input type="text" class="cesium-input" id="landmark-longitude" autocomplete="off" required>`,
			`<div class="input-error" id="landmark-longitude-error"></div>`,
			`<div class="input-title">Latitude</div>`,
			`<input type="text" class="cesium-input" id="landmark-latitude" autocomplete="off" required>`,
			`<div class="input-error" id="landmark-latitude-error"></div>`,
			`<div style="margin-top:20px;text-align:center">`,
				`<button id="add-landmark-submit" class="cesium-button" style="margin-right:20px">Submit</button>`,
				`<button id="add-landmark-cancel" class="cesium-button">Cancel</button>`,
			`</div>`,
		].join("");
		document.querySelector(".cesium-infoBox-title").innerText = "Add Landmark";
		infoBoxElement.classList.add("cesium-infoBox-visible");
	});
}

document.querySelector(".cesium-infoBox-close").addEventListener("click", function () {
	infoBoxElement.classList.remove("cesium-infoBox-visible");
});

docId("list-layers").addEventListener("click", function (e) {
	if (e.target && e.target.nodeName === "LI") {
		var id = e.target.getAttribute("data-id");
		var entity = viewer.entities.getById(id);
		var cartographic = Cesium.Cartographic.fromCartesian(entity.position.getValue()); //WGS84
		var destination = Cesium.Cartesian3.fromRadians(cartographic.longitude, cartographic.latitude, cartographic.height+10000000, MARSIAU2000);
		viewer.camera.flyTo({
			destination: destination,
			duration: 2,
		});
        selectLandingSite(entity);
	}
});

docId("list-landmarks").addEventListener("click", function (e) {
	if (e.target && e.target.nodeName === "LI") {
		var id = e.target.getAttribute("data-id");
		var entity = viewer.entities.getById(id);
		if (entity) {
		    var cartographic = Cesium.Cartographic.fromCartesian(entity.position.getValue()); //WGS84
		    var newDestination = Cesium.Cartesian3.fromRadians(cartographic.longitude, cartographic.latitude, cartographic.height+20000, MARSIAU2000);
			viewer.camera.flyTo({
				destination: newDestination,
				duration: 2
			});
			selectLandmark(entity);
		}
	}
});

function layerInfoDescription(response) {
	var layer = response.layers[0];
	var extent_array = layer.extent.split(",");
	var html_arr = [
		`<div class="title">${layer.title}</div>`,
   	    `<div class="image-box">`,
		    `<img src="${site_resource.uploadUrl}/mars_layers/${layer.image}" />`,
		`</div>`,
		`<div style="margin-top:10px;margin-bottom:10px;">${layer.description}</div>`,
		`<table class="cesium-infoBox-defaultTable"><tbody>`,
		`<tr><th rowspan="5">Extent</th></tr>`,
		`<tr><td>W: ${extent_array[0]}</td></tr>`,
		`<tr><td>S: ${extent_array[1]}</td></tr>`,
		`<tr><td>E: ${extent_array[2]}</td></tr>`,
		`<tr><td>N: ${extent_array[3]}</td></tr>`,
		`<tr><th>Category</th><td>${layer.category}</td></tr>`,
		`<tr><th>Sub Category</th><td>${layer.sub_category}</td></tr>`,
		`<tr><th>Tiles</th><td>${layer.tiles}</td></tr>`,
		`</tbody></table>`
	];
	if (response.editable) {
		html_arr = html_arr.concat([
			`<div style="margin-top:20px;text-align:center;">`,
			`<button id="update-layer" class="cesium-button" style="margin-right:20px">Update</button>`,
			`<button id="remove-layer" class="cesium-button">Remove</button>`,
			`</div>`
		]);
	}
	return html_arr.join('');
}

function landmarkInfoDescription(response) {
	var landmark = response.landmarks[0];
	var images = JSON.parse(landmark.image);
	var imageTitles = JSON.parse(landmark.image_title);
	var imageDescriptions = JSON.parse(landmark.description);
	var html_arr = [];
	html_arr.push(`<div class="title">${landmark.title}</div>`);
	for(let i=0;i<images.length;i++){
		html_arr = html_arr.concat([
			`<a class="image-box" href="${site_resource.uploadUrl}/mars_landmarks/${images[i]}" target="_blank">`,
				`<img src="${site_resource.uploadUrl}/mars_landmarks/${images[i]}" />`,
				`<div>${imageTitles[i]}</div>`,
			`</a>`,
			`<div style="margin-top:10px;margin-bottom:10px;">${imageDescriptions[i]}</div>`
	   ]);
	}
	html_arr.push(`<div style="margin-top:10px;margin-bottom:10px;">Location: [${landmark.longitude}, ${landmark.latitude}]</div>`);
	if (response.editable) {
		html_arr = html_arr.concat([
			`<div style="margin-top:20px;text-align:center;">`,
			`<button id="update-landmark" class="cesium-button" style="margin-right:20px">Update</button>`,
			`<button id="remove-landmark" class="cesium-button">Remove</button>`,
			`</div>`
		]);
	}
	return html_arr.join('');
}

function parcelSubmitable(action){
	// check validate 
	var validationErrors = [];
	docId("parcel-name-error").style.display = 'none';
	docId("parcel-youtube-error").style.display = 'none';
	if(action == 'buy'){
		docId("parcel-image-error").style.display = 'none';
		if (!docId("parcel-image").checkValidity()) {
			docId("parcel-image-error").style.display = 'block';
			docId("parcel-image-error").innerHTML = docId("parcel-image").validationMessage;
			validationErrors.push(docId("parcel-image").validationMessage);
		}
	}
	if (!docId("parcel-name").checkValidity()) {
		docId("parcel-name-error").style.display = 'block';
		docId("parcel-name-error").innerHTML = docId("parcel-name").validationMessage;
		validationErrors.push(docId("parcel-name").validationMessage);
	}
	if (docId("parcel-youtube").value && !validateYouTubeUrl(docId("parcel-youtube").value)) {
		docId("parcel-youtube-error").style.display = 'block';
		docId("parcel-youtube-error").innerHTML = "Youtube link is not correct.";
		validationErrors.push("Youtube link is not correct.");
	}
	return validationErrors.length == 0 ? true : false;
}

function layerSubmitable(action) {
	// check validate 
	var validationErrors = [];
	docId("layer-title-error").style.display = 'none';
	if (action == 'add') {
		docId("layer-image-error").style.display = 'none';
	}
	docId("layer-description-error").style.display = 'none';
	docId("layer-extent-error").style.display = 'none';
	if (!docId("layer-title").checkValidity()) {
		docId("layer-title-error").style.display = 'block';
		docId("layer-title-error").innerHTML = docId("layer-title").validationMessage;
		validationErrors.push(docId("layer-title").validationMessage);
	}
	if (action == 'add') {
		if (!docId("layer-image").checkValidity()) {
			docId("layer-image-error").style.display = 'block';
			docId("layer-image-error").innerHTML = docId("layer-image").validationMessage;
			validationErrors.push(docId("layer-image").validationMessage);
		}
	}
	if (!docId("layer-description").checkValidity()) {
		docId("layer-description-error").style.display = 'block';
		docId("layer-description-error").innerHTML = docId("layer-description").validationMessage;
		validationErrors.push(docId("layer-description").validationMessage);
	}
	if (!docId("layer-extent").checkValidity()) {
		docId("layer-extent-error").style.display = 'block';
		docId("layer-extent-error").innerHTML = docId("layer-extent").validationMessage;
		validationErrors.push(docId("layer-extent").validationMessage);
	} else {
		var extentValue = docId("layer-extent").value;
		var extentArray = extentValue.split(',');
		if (extentArray.length != 4) {
			docId("layer-extent-error").style.display = 'block';
			docId("layer-extent-error").innerHTML = 'Extent must be W,S,E,N values with comma';
			validationErrors.push('Extent must be W,S,E,N values with comma');
		}
		if ((parseFloat(extentArray[0]) < -180 || parseFloat(extentArray[0]) > 180) ||
			(parseFloat(extentArray[1]) < -90 || parseFloat(extentArray[1]) > 90) ||
			(parseFloat(extentArray[2]) < -180 || parseFloat(extentArray[2]) > 180) ||
			(parseFloat(extentArray[3]) < -90 || parseFloat(extentArray[3]) > 90)) {
			docId("layer-extent-error").style.display = 'block';
			docId("layer-extent-error").innerHTML = 'Please input correct extent values';
			validationErrors.push('Please correct extent values');
		}
	}
	return validationErrors.length == 0 ? true : false;
}

function landmarkSubmitable(action) {
	var validationErrors = [];
	docId("landmark-title-error").style.display = 'none';
    docId("landmark-image-error").style.display = 'none';
	docId("landmark-longitude-error").style.display = 'none';
	docId("landmark-latitude-error").style.display = 'none';
	if (!docId("landmark-title").checkValidity()) {
		docId("landmark-title-error").style.display = 'block';
		docId("landmark-title-error").innerHTML = docId("landmark-title").validationMessage;
		validationErrors.push(docId("landmark-title").validationMessage);
	}
	if (!docId("landmark-image").checkValidity()) {
		if (action == 'add' || (action == 'update' && docId('image-items').children.length == 0)) {
			docId("landmark-image-error").style.display = 'block';
			docId("landmark-image-error").innerHTML = docId("landmark-image").validationMessage;
			validationErrors.push(docId("landmark-image").validationMessage);
		}
	}
	
	if (!docId("landmark-longitude").checkValidity()) {
		docId("landmark-longitude-error").style.display = 'block';
		docId("landmark-longitude-error").innerHTML = docId("landmark-longitude").validationMessage;
		validationErrors.push(docId("landmark-longitude").validationMessage);
	} else {
		var logitudeValue = parseFloat(docId("landmark-longitude").value);
		if (logitudeValue < -180 || logitudeValue > 180) {
			docId("landmark-longitude-error").style.display = 'block';
			docId("landmark-longitude-error").innerHTML = 'Longitude must be between -180 and 180.';
			validationErrors.push('Longitude must be between -180 and 180.');
		}
	}
	if (!docId("landmark-latitude").checkValidity()) {
		docId("landmark-latitude-error").style.display = 'block';
		docId("landmark-latitude-error").innerHTML = docId("landmark-latitude").validationMessage;
		validationErrors.push(docId("landmark-latitude").validationMessage);
	} else {
		var latitudeValue = parseFloat(docId("landmark-latitude").value);
		if (latitudeValue < -180 || latitudeValue > 180) {
			docId("landmark-latitude-error").style.display = 'block';
			docId("landmark-latitude-error").innerHTML = 'Latitude must be between -180 and 180.';
			validationErrors.push('Latitude must be between -180 and 180.');
		}
	}
	return validationErrors.length == 0 ? true : false;
}