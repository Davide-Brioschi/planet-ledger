var viewer;
const R = 3396000; // 3396190
const MARSIAU2000 = new Cesium.Ellipsoid(3396000.0, 3396000.0, 3396000.0);
Cesium.Ellipsoid.WGS84 = MARSIAU2000;// Hack for true entitys generation. This is bug in Cesium

var parcels = [];
var zoom_level;
var cursorEntity = null, selectedEntity = null;
var tempEntities = [], tempImageryLayers = [];

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
		'action': 'search_mars_parcels',
		'search_input': input
	  }
	});
	return resource.fetchJson().then(function (results) {
	  return results.map(function (resultObject) {
		var parcel_number = parseInt(resultObject.parcel_id.split("_")[1]) - 1;
		return {
		  displayName: [
			  resultObject.parcel_name,
			  resultObject.user_name,
			  resultObject.parcel_id,
		  ].join(", "),
		  destination: parcels[8][parcel_number].rectangle.coordinates
		};
	  });
	});
};

initMap();

function initMap(){
	const IMAGERY_SERVER ='https://lasp.colorado.edu/media/projects/tms_trees/';
	var imageryViewModels = [
		new Cesium.ProviderViewModel({
			name: 'Vector',
			iconUrl: site_resource.baseUrl + '/assets/images/VectorThumb.png',
			creationFunction: function() {
				return new Cesium.WebMapTileServiceImageryProvider({
					url: 'https://cartocdn-gusc.global.ssl.fastly.net/opmbuilder/api/v1/map/named/opm-mars-basemap-v0-2/all/{TileMatrix}/{TileCol}/{TileRow}.png',
					format: "image/png",
					style: "default",
					ellipsoid: MARSIAU2000
				});
			}
		}),
		new Cesium.ProviderViewModel({
			name: 'Viking',
			iconUrl: site_resource.baseUrl + '/assets/images/VikingThumb.png',
			tooltip: 'Viking true-ish color (http://www.mars.asu.edu/data/mdim_color/)',
			creationFunction: function() {
				return new Cesium.TileMapServiceImageryProvider({
					url: IMAGERY_SERVER + 'mars-viking',
					ellipsoid: MARSIAU2000,
					fileExtension: 'png',
					minimumLevel: 0,
					maximumLevel: 5,
					flipXY: true
				});
			}
		}),
		new Cesium.ProviderViewModel({
			name: 'High-Viking',
			iconUrl: site_resource.baseUrl + '/assets/images/HighVikingThumb.png',
			tooltip: 'Viking true-ish color (http://www.mars.asu.edu/data/mdim_color/)',
			creationFunction: function() {
				return new Cesium.WebMapServiceImageryProvider({
					url: "https://planetarymaps.usgs.gov/cgi-bin/mapserv?map=/maps/mars/mars_simp_cyl.map",
					layers: "MDIM21_color"
				});
			}
		}),
		new Cesium.ProviderViewModel({
			name: 'MOLA',
			iconUrl: site_resource.baseUrl + '/assets/images/MolaThumb.png',
			tooltip: 'MOLA Color Height Map (http://www.mars.asu.edu/data/mdim_color/)',
			creationFunction: function() {
				return new Cesium.TileMapServiceImageryProvider({
					url: IMAGERY_SERVER + 'mars-mola',
					fileExtension: 'png',
					minimumLevel: 0,
					maximumLevel: 7,
					flipXY: true
				});
			}
		}),
		new Cesium.ProviderViewModel({
			name: 'MOLA-SR',
			iconUrl: site_resource.baseUrl + '/assets/images/MolaSrThumb.png',
			tooltip: 'MOLA Shaded Relief Map (http://www.mars.asu.edu/data/molasr/)',
			creationFunction: function() {
				return new Cesium.TileMapServiceImageryProvider({
					url: IMAGERY_SERVER + 'mars-mola-sr',
					fileExtension: 'png',
					minimumLevel: 0,
					maximumLevel: 5,
					flipXY: true
				});
			}
		})
	];
	
	var terrainViewModels = [
		new Cesium.ProviderViewModel({
			name: "MARS-ELLIPSOID",
			tooltip: "MARSIAU2000",
			iconUrl: site_resource.baseUrl + "/assets/images/Ellipsoid.png",
			creationFunction: function() {
				return new Cesium.EllipsoidTerrainProvider({ ellipsoid: MARSIAU2000 });
			}
		})
	];
	
	viewer = new Cesium.Viewer('cesiumContainer',{
		baseLayerPicker: true,
		sceneMode: Cesium.SceneMode.SCENE3D,
		mapProjection: new Cesium.GeographicProjection(MARSIAU2000),
		globe: new Cesium.Globe(MARSIAU2000),
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

	viewer.scene.skyAtmosphere.hueShift = 0.47;
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
	
	for(var i=0;i<9;i++){
		parcels[i] = getParcels(i);
	}
	
}

function addViewerEvents(){
	Cesium.knockout.track(viewModel);
	Cesium.knockout.applyBindings(viewModel, toolbarElement);
	Cesium.knockout.getObservable(viewModel, 'show').subscribe(
        function(newValue) {
			for(var key in tempImageryLayers){
				var index = viewer.imageryLayers.indexOf(tempImageryLayers[key]);
				if(index > 0){
					viewer.imageryLayers.get(index).show = newValue;
					tempImageryLayers[key].show =  newValue;
				}
			}
        }
	);

    Cesium.knockout.getObservable(viewModel, 'alpha').subscribe(
        function(newValue) {
			for(var key in tempImageryLayers){
				var index = viewer.imageryLayers.indexOf(tempImageryLayers[key]);
				if(index > 0){
					viewer.imageryLayers.get(index).alpha = newValue;
					tempImageryLayers[key].alpha =  newValue;
				}
			}
        }
	);
    
	viewer.geocoder.viewModel.destinationFound = function(viewModel, destination) {
		searchRectangle = destination;
		viewer.camera.setView({
			//destination: destination
			//destination: Cesium.Rectangle.fromRadians(west, south, east, north)
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

			if(zoom_level >= 8){
				var pickedObject = viewer.scene.pick(mousePosition);
				if (!Cesium.defined(pickedObject)) {
					return;
				}
				if(!pickedObject.id) return;
				
				if(cursorEntity){
					cursorEntity.rectangle.extrudedHeight = 0;
					cursorEntity.rectangle.outlineColor = Cesium.Color.BLACK;
					if(selectedEntity){
						selectedEntity.rectangle.extrudedHeight = 100;
						selectedEntity.rectangle.outlineColor = Cesium.Color.YELLOW;
					}
				}
				cursorEntity = pickedObject.id;
				cursorEntity.rectangle.extrudedHeight = 100;
				cursorEntity.rectangle.outlineColor = Cesium.Color.YELLOW;
			}

		} else {
			docId("coordinates").style.display = 'none';
		}
	}, Cesium.ScreenSpaceEventType.MOUSE_MOVE);

	viewer.screenSpaceEventHandler.setInputAction(function onLeftClick(movement) {
		
		if(zoom_level < 8 ) return;

		var pickedObject = viewer.scene.pick(movement.position);
		if (!Cesium.defined(pickedObject)) {
			return;
		}
		if(!pickedObject.id) return;
		
		setSelection(pickedObject.id);
		
	}, Cesium.ScreenSpaceEventType.LEFT_CLICK);

	viewer.camera.moveEnd.addEventListener(async function(e) {
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
		if(height){
			zoom_level = getZoomLevel(height);
			var height_value = height/1000; //km
			var altitude = height_value > 1 ? parseInt(height_value): height_value.toFixed(2);
			docId("altitude").style.display = 'block';
			
			if(zoom_level < 0){
				toolbarElement.style.display = 'none';
				toolTipElement.style.display = 'none';
				docId("altitude").innerHTML = `Altitude: ${altitude} km, Zoom: ${zoom_level}, 0 parcels`;
				viewer.entities.removeAll();
				tempEntities = [];
				for(var key in tempImageryLayers){
					viewer.imageryLayers.remove(tempImageryLayers[key]);
				}
				tempImageryLayers = [];
			}else if(zoom_level >= 0 && zoom_level < 8){
				toolbarElement.style.display = 'none';
				toolTipElement.style.display = 'none';
				docId("altitude").innerHTML = `Altitude: ${altitude} km, Zoom: ${zoom_level}, ${parcels[zoom_level].length} parcels`;
				for(var key in tempImageryLayers){
					viewer.imageryLayers.remove(tempImageryLayers[key]);
				}
				tempImageryLayers = [];
				
				parcels[zoom_level].forEach(entity=>{
					var coordinates = entity.rectangle.coordinates;
					var x_overlap = Math.max(0, Math.min(rectView.east, coordinates.east) - Math.max(rectView.west, coordinates.west));
					var y_overlap = Math.max(0, Math.min(rectView.north, coordinates.north) - Math.max(rectView.south, coordinates.south));
					var overlapArea = x_overlap * y_overlap;
					if(overlapArea > 0)	{
						newTempEntities[entity.id] = entity;
					}
				});

				for(var key in tempEntities){
					if(!newTempEntities[key]){
						viewer.entities.remove(tempEntities[key]);
					}
				}
				for(var key in newTempEntities){
					if(!tempEntities[key]){
						if(selectedEntity && selectedEntity.id === key){
							viewer.entities.add(selectedEntity);   
						}else{
							viewer.entities.add(newTempEntities[key]);   
						}
					}
				}

				tempEntities = newTempEntities;
				
			}else{
				toolbarElement.style.display = 'block';
				docId("altitude").innerHTML = `Altitude: ${altitude} km, Zoom: ${zoom_level}, ${parcels[8].length} parcels`;
				var parcel_ids = [];
				parcels[8].forEach(entity=>{
					var coordinates = entity.rectangle.coordinates;
					var x_overlap = Math.max(0, Math.min(rectView.east, coordinates.east) - Math.max(rectView.west, coordinates.west));
					var y_overlap = Math.max(0, Math.min(rectView.north, coordinates.north) - Math.max(rectView.south, coordinates.south));
					var overlapArea = x_overlap * y_overlap;
					if(overlapArea > 0)	{
						newTempEntities[entity.id] = entity;
						parcel_ids.push(`'${entity.id}'`);
					}
				});

				for(var key in tempEntities){
					if(!newTempEntities[key]){
						viewer.entities.removeById(key);
					}
				}
				for(var key in newTempEntities){
					if(!tempEntities[key]){
						if(selectedEntity && selectedEntity.id === key){
							viewer.entities.add(selectedEntity);   
						}else{
							viewer.entities.add(newTempEntities[key]);   
						}
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
				formData.append("action", "get_mars_parcel_ids");
				formData.append("parcel_ids", parcel_ids.join(","));
				fetch(site_resource.ajaxUrl, {
					method: 'POST',
					body: formData
				})
				.then(response => response.json())
				.then(result => {
					if(result.length>0){
						result.forEach(item=>{
							newTempImageryLayers[item.parcel_id] = new Cesium.ImageryLayer(
								new Cesium.SingleTileImageryProvider({
									url: site_resource.uploadUrl + `/mars/${item.parcel_id}.png?${Date.now()}`,
									rectangle: tempEntities[item.parcel_id].rectangle.coordinates
								}),
								{
									alpha: viewModel.alpha,
									show: viewModel.show
								}
							);
						});
						
						for(var key in tempImageryLayers){
							if(!newTempImageryLayers[key]){
								viewer.imageryLayers.remove(tempImageryLayers[key]);
							}
						}
						
						for(var key in newTempImageryLayers){
							if(!tempImageryLayers[key]){
								viewer.imageryLayers.add(newTempImageryLayers[key]);
							}else{
								newTempImageryLayers[key] = tempImageryLayers[key];
							}
						}
						
						tempImageryLayers = newTempImageryLayers;
		
					}else{
						for(var key in tempImageryLayers){
							viewer.imageryLayers.remove(tempImageryLayers[key]);
						}
						tempImageryLayers = [];
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
				'</tbody></table>',
				`<div style="margin-top:10px;text-align:center">`,
					`<button id="buy-yes" class="cesium-button" style="margin-right:20px">Submit</button>`,
					`<button id="buy-cancel" class="cesium-button">Cancel</button>`,
				`</div>`,
			].join("");
		}
		if(e.target && e.target.id== 'buy-cancel'){
			infoBoxDescriptionElement.innerHTML = [
				'<div>',
					'<div>This parcel is free.</div>',
					`You can <button id="buy-parcel" class="cesium-button">Buy</button> this parcel.`,
				'</div>'
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
			formData.append("action", "remove_mars_parcel");
			formData.append("parcel_id", selectedEntity.id);
			infoBoxDescriptionElement.innerHTML = 'Release <div class="cesium-infoBox-loading"></div>';
			fetch(site_resource.ajaxUrl, {
				method: 'POST',
				body: formData
			})
			.then(response => response.json())
			.then(result => {
				if(tempImageryLayers[selectedEntity.id])  {
					viewer.imageryLayers.remove(tempImageryLayers[selectedEntity.id]);
					delete tempImageryLayers[selectedEntity.id];
				}
				infoBoxDescriptionElement.innerHTML = [
					'<div>',
						'<div>This parcel is free.</div>',
						`You can <button id="buy-parcel" class="cesium-button">Buy</button> this parcel.`,
					'</div>'
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
			if(validationError.length > 0){
				return;
			}
			const formData = new FormData();
			formData.append("action", "update_mars_parcel");
			formData.append("parcel_id", selectedEntity.id);
			if(docId("parcel_image").checkValidity()){
				var newImageFile = await compress(docId("parcel_image").files[0], selectedEntity.id+'.png');
				formData.append("parcel_image", newImageFile);
			}
			formData.append("parcel_name", docId("parcel_name").value);
			formData.append("parcel_description", docId("parcel_description").value);
			formData.append("parcel_status", docId("parcel_status").value);
	
			infoBoxDescriptionElement.innerHTML = 'Updating <div class="cesium-infoBox-loading"></div>';
			fetch(site_resource.ajaxUrl, {
				method: 'POST',
				body: formData
			})
			.then(response => response.json())
			.then(result => {
				if(result.parcels.length>0){
					var parcelInfo = result.parcels[0];
					if(selectedEntity.id === parcelInfo.parcel_id){
						viewer.imageryLayers.remove(tempImageryLayers[selectedEntity.id]);
						tempImageryLayers[selectedEntity.id] = new Cesium.ImageryLayer(
							new Cesium.SingleTileImageryProvider({
								url: site_resource.uploadUrl + `/mars/${selectedEntity.id}.png?${Date.now()}`,
								rectangle: selectedEntity.rectangle.coordinates.getValue()
							}),
							{
								alpha: viewModel.alpha,
								show: viewModel.show
							}
						);
						viewer.imageryLayers.add(tempImageryLayers[selectedEntity.id]);
						selectedEntity.properties = result;
						infoBoxDescriptionElement.innerHTML = parcelInfoDescription(result);
					}
				}else{
					infoBoxDescriptionElement.innerHTML = '<div style="color:red">Submit Error</div>';
				}
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
	
			if(validationError.length > 0){
				return;
			}
	
			const formData = new FormData();
			formData.append("action", "add_mars_parcel");
			formData.append("parcel_id", selectedEntity.id);
			var newImageFile = await compress(docId("parcel_image").files[0], selectedEntity.id+'.png');
			formData.append("parcel_image", newImageFile);
			formData.append("parcel_name", docId("parcel_name").value);
			formData.append("parcel_description", docId("parcel_description").value);
			formData.append("parcel_status", docId("parcel_status").value);
	
			infoBoxDescriptionElement.innerHTML = 'Buying <div class="cesium-infoBox-loading"></div>';
	
			fetch(site_resource.ajaxUrl, {
				method: 'POST',
				body: formData
			})
			.then(response => response.json())
			.then(result => {
				if(result.parcels.length>0){
					var parcelInfo = result.parcels[0];
					if(selectedEntity.id === parcelInfo.parcel_id){
						tempImageryLayers[selectedEntity.id] = new Cesium.ImageryLayer(
							new Cesium.SingleTileImageryProvider({
								url: site_resource.uploadUrl + `/mars/${selectedEntity.id}.png?${Date.now()}`,
								rectangle: selectedEntity.rectangle.coordinates.getValue()
							}),
							{
								alpha: viewModel.alpha,
								show: viewModel.show
							}
						);
						viewer.imageryLayers.add(tempImageryLayers[selectedEntity.id]);
						selectedEntity.properties = result;
						infoBoxDescriptionElement.innerHTML = parcelInfoDescription(result);
					}
				}else{
					infoBoxDescriptionElement.innerHTML = [
						'<div>',
							'<div style="color:red">Submit Error</div>',
							`You can <button id="buy-parcel" class="cesium-button">Buy</button> this parcel again.`,
						'</div>'
					].join("");
				}
			})
			.catch(error => {
				//console.error('Error:', error);
				infoBoxDescriptionElement.innerHTML = [
					'<div>',
						'<div style="color:red">Submit Error</div>',
						`You can <button id="buy-parcel" class="cesium-button">Buy</button> this parcel again.`,
					'</div>'
				].join("");
			});
		}
	});
}

function getParcels(zoom){
	var result = [];
	// drawing grid on globe
	var n = Math.pow(2, zoom+2) * Math.pow(2, zoom+2);
	
    var ds = 4*Math.PI*R*R/n; // area size of a parcel
    var dy = Math.sqrt(9/16*ds); // dy size of a parcel
	dlat0 = Math.acos(1-ds/(2*Math.PI*R*R))*180/Math.PI; // delta lat of a parcel of pole, this is a circle
	var dlat = (180-2*dlat0)/(Math.PI*R-2*R*dlat0*Math.PI/180)*dy;

	var count = 0;
	count++
	// north pole
	
	result.push({
		id: zoom + '_' + count, 
		rectangle: {
			coordinates: Cesium.Rectangle.fromDegrees(-180, 90-dlat0, 180, 90),
			fill: true,
			material: Cesium.Color.WHITE.withAlpha(0.01),
			height: 0,
			outline: true, // height must be set for outline to display
			outlineColor: Cesium.Color.BLACK,
		}
	});
	
    var lat = 90 - dlat0;
    while (lat>-90+dlat0) {
		var lat_s = get_surface_area(-180, 180, lat-dlat, lat); // area of a lat band
		var cols = Math.round(lat_s/ds); // parcel count of a lat band
		
		var lat_1 = Math.asin(Math.sin(lat*Math.PI/180) - ds*cols/(2*Math.PI*R*R))*180/Math.PI; // adjust next lat value
		//var lat_1 = lat-dlat;

		if(lat_1 < -90+dlat0 || lat_1-dlat < -90+dlat0){
		   lat_1 = -90+dlat0;
		   lat_s = get_surface_area(-180, 180, lat_1, lat); // area of a lat band
		   cols = Math.round(lat_s/ds); // parcel count of a lat band
		}
		
        var dlng = 360/cols;
        for(var j=0;j<cols;j++){
            var lng = -180 + j * dlng;
            var e_lng = lng + dlng;
            if(e_lng > 180){
                e_lng = 180
			}
			count++;
			result.push({
				id: zoom + '_' + count, 
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
		id: zoom + '_' + count, 
		rectangle: {
			coordinates: Cesium.Rectangle.fromDegrees(-180, -90, 180, -90+dlat0),
			fill: true,
			material: Cesium.Color.WHITE.withAlpha(0.01),
			height: 0,
			outline: true, // height must be set for outline to display
			outlineColor: Cesium.Color.BLACK,
		}
	});

	return result;
}

function get_surface_area(lng1, lng2, lat1, lat2){
	var lng_1 = lng1*Math.PI/180;
	var lng_2 = lng2*Math.PI/180;
	var lat_1 = lat1*Math.PI/180;
	var lat_2 = lat2*Math.PI/180;
	return R*R*(lng_2-lng_1)*(Math.sin(lat_2)-Math.sin(lat_1));
 }

 function getZoomLevel(altitude_value){
    return Math.round(Math.log(2*Math.PI*R/altitude_value)/Math.log(2));
 }

 function compress(imageFile, newFileName) {
	return new Promise(resolve => {
		const width = 256;
		const height = 144;
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

    if(selectedEntity){
		selectedEntity.rectangle.extrudedHeight = 0;
		selectedEntity.rectangle.outlineColor = Cesium.Color.BLACK;
		selectedEntity.rectangle.material = Cesium.Color.WHITE.withAlpha(0.01);
	}
	selectedEntity = entity;
	selectedEntity.rectangle.outlineColor = Cesium.Color.YELLOW;
	selectedEntity.rectangle.material = Cesium.Color.YELLOW.withAlpha(0.25);

	viewer.selectedEntity = selectedEntity;

	var coordinates = selectedEntity.rectangle.coordinates.getValue();
	var north = Cesium.Math.toDegrees(coordinates.north),
		south = Cesium.Math.toDegrees(coordinates.south),
		west = Cesium.Math.toDegrees(coordinates.west),
		east = Cesium.Math.toDegrees(coordinates.east);
	var area_size = get_surface_area(west, east, south, north)/1000000;

	toolTipElement.style.display = 'block';
	toolTipElement.innerHTML= [
		'<table class="cesium-infoBox-defaultTable"><tbody>',
		`<tr><th>ID</th><td>${selectedEntity.id}</td></tr>`,
		`<tr><th>North</th><td>${north.toFixed(6)}</td></tr>`,
		`<tr><th>West</th><td>${west.toFixed(6)}</td></tr>`,
		`<tr><th>East</th><td>${east.toFixed(6)}</td></tr>`,
		`<tr><th>South</th><td>${south.toFixed(6)}</td></tr>`,
		`<tr><th>Surface Area</th><td>${area_size.toFixed(6)} km<sup>2</sup></td></tr>`,
		'</tbody></table>'
	].join('');

	infoBoxDescriptionElement.innerHTML = 'Loading <div class="cesium-infoBox-loading"></div>';

	const formData = new FormData();
	formData.append("action", "get_mars_parcel");
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
		if(social_media.facebook !== ''){
			html_arr.push(`<a href="${social_media.facebook}" class="fa fa-facebook" target="_blank" title="facebook"></a>`);
		}
		if(social_media.twitter !== ''){
			html_arr.push(`<a href="${social_media.twitter}" class="fa fa-twitter" target="_blank" title="twitter"></a>`);
		}
		if(social_media.linkedin !== ''){
			html_arr.push(`<a href="${social_media.linkedin}" class="fa fa-linkedin" target="_blank" title="linkedin"></a>`);
		}
		if(social_media.googleplus !== ''){
			html_arr.push(`<a href="${social_media.googleplus}" class="fa fa-google-plus" target="_blank" title="google plus"></a>`);
		}
		if(social_media.instagram !== ''){
			html_arr.push(`<a href="${social_media.instagram}" class="fa fa-instagram" target="_blank" title="instagram"></a>`);
		}
		html_arr.push('</div></td></tr>');

		if(social_media.youtube !== ''){
			var youtube_video_id = getYoutubeVideoId(social_media.youtube);
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
		return [
			'<div>',
				'<div>This parcel is free.</div>',
				`You can <button id="buy-parcel" class="cesium-button">Buy</button> this parcel.`,
			'</div>'
		].join("");
	}
 }

function getYoutubeVideoId(url){
	var regExp = /^https?\:\/\/(?:www\.youtube(?:\-nocookie)?\.com\/|m\.youtube\.com\/|youtube\.com\/)?(?:ytscreeningroom\?vi?=|youtu\.be\/|vi?\/|user\/.+\/u\/\w{1,2}\/|embed\/|watch\?(?:.*\&)?vi?=|\&vi?=|\?(?:.*\&)?vi?=)([^#\&\?\n\/<>"']*)/i;
	var match = url.match(regExp);
	return (match && match[1].length==11)? match[1] : false;
}