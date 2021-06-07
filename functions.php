<?php

function child_theme_enqueue_styles() {
    wp_enqueue_style( 'i-craft-style', get_template_directory_uri() . '/style.css' );
    //wp_enqueue_style( 'i-craft-child-style', get_stylesheet_directory_uri() . '/style.css');
    wp_enqueue_style( 'icraft-style', get_stylesheet_uri(), array(), time(), 'all');
}
add_action( 'wp_enqueue_scripts', 'child_theme_enqueue_styles' );

add_action('wp_enqueue_scripts','page_styles');

function page_styles(){
    if(is_home() || is_front_page()){
        wp_enqueue_style( 'home-style',  get_stylesheet_directory_uri().'/assets/css/home.css', 'icraft-child-style', time(), 'all');
    }
    if(is_page('mars') || is_page('moon')){
        wp_enqueue_style( 'cropper-style', 'https://cdnjs.cloudflare.com/ajax/libs/cropperjs/1.5.11/cropper.min.css', 'icraft-child-style', time(), 'all');
        wp_enqueue_style( 'cesium-widgets-style',  get_stylesheet_directory_uri().'/Cesium-1.79.1/Build/Cesium/Widgets/widgets.css', 'cropper-style', time(), 'all');
        wp_enqueue_style( 'cesium-InfoBoxDescription-style',  get_stylesheet_directory_uri().'/Cesium-1.79.1/Build/Cesium/Widgets/InfoBox/InfoBoxDescription.css', 'cesium-widgets-style', time(), 'all');
        wp_enqueue_style( 'cesium-sandcastle-style',  get_stylesheet_directory_uri().'/Cesium-1.79.1/Apps/Sandcastle/templates/bucket.css', 'cesium-InfoBoxDescription-style', time(), 'all');
        wp_enqueue_style( 'cesium-map-style',  get_stylesheet_directory_uri().'/assets/css/cesium-map.css', 'cesium-sandcastle-style', time(), 'all');
    }
}

add_action('wp_enqueue_scripts','cesium_map_scripts');

function cesium_map_scripts(){
    if(is_page('mars') || is_page('moon')){
        wp_enqueue_script( 'cropper-script', 'https://cdnjs.cloudflare.com/ajax/libs/cropperjs/1.5.11/cropper.min.js', array(), time(), true );
        wp_enqueue_script( 'numeral-script', '//cdnjs.cloudflare.com/ajax/libs/numeral.js/2.0.6/numeral.min.js', array(), time(), true );
        wp_enqueue_script( 'cesium-script', get_stylesheet_directory_uri().'/Cesium-1.79.1/Build/Cesium/Cesium.js', array(), time(), true );
        wp_enqueue_script( 'sandcastle-script', get_stylesheet_directory_uri().'/Cesium-1.79.1/Apps/Sandcastle/Sandcastle-header.js', array(), time(), true );
        wp_enqueue_script( 'list-script', '//cdnjs.cloudflare.com/ajax/libs/list.js/2.3.1/list.min.js', array(), time(), true );
        $upload_dir = wp_upload_dir();
        $data=array(
            'siteUrl' => site_url(),
            'ajaxUrl' => admin_url('admin-ajax.php'),
            'baseUrl' => get_stylesheet_directory_uri(),
            'uploadUrl' => $upload_dir['baseurl'],
        );
        wp_localize_script('sandcastle-script', 'site_resource', $data );

    }
    if(is_page('mars')){
        wp_enqueue_script( 'cesium-mars-script', get_stylesheet_directory_uri().'/assets/js/cesium-mars.js', 'sandcastle-script', time(), true );
    }
    if(is_page('moon')){
        wp_enqueue_script( 'cesium-moon-script', get_stylesheet_directory_uri().'/assets/js/cesium-moon.js', 'sandcastle-script', time(), true );
    }
}

add_action('wp_ajax_get_mars_layers', 'get_mars_layers_callback');
add_action("wp_ajax_nopriv_get_mars_layers", "get_mars_layers_callback");

function get_mars_layers_callback(){
    header('content-type: application/json; charset=utf-8');
    global $wpdb;
    $sql="SELECT id,title,extent FROM {$wpdb->prefix}mars_layers ORDER BY title";
    $layers = $wpdb->get_results($sql, ARRAY_A);
    $result = array(
        "result" => "success",
        "layers" => $layers
    );
    wp_send_json($result);
    wp_die();
}

add_action('wp_ajax_get_moon_layers', 'get_moon_layers_callback');
add_action("wp_ajax_nopriv_get_moon_layers", "get_moon_layers_callback");

function get_moon_layers_callback(){
    header('content-type: application/json; charset=utf-8');
    global $wpdb;
    $sql="SELECT id,title,extent FROM {$wpdb->prefix}moon_layers ORDER BY title";
    $layers = $wpdb->get_results($sql, ARRAY_A);
    $result = array(
        "result" => "success",
        "layers" => $layers
    );
    wp_send_json($result);
    wp_die();
}

add_action('wp_ajax_get_mars_layer', 'get_mars_layer_callback');
add_action("wp_ajax_nopriv_get_mars_layer", "get_mars_layer_callback");

function get_mars_layer_callback(){
    header('content-type: application/json; charset=utf-8');
    global $wpdb;
    $id=$_POST["id"];
    $sql="SELECT * FROM {$wpdb->prefix}mars_layers WHERE id={$id}";
    $layers = $wpdb->get_results($sql, ARRAY_A);
    $sql="SELECT id,title,longitude,latitude FROM {$wpdb->prefix}mars_landmarks WHERE layer_id={$id} ORDER BY title";
    $landmarks = $wpdb->get_results($sql, ARRAY_A);
    $result = array(
        "result" => "success",
        "layers" => $layers,
        "landmarks" => $landmarks,
        "editable" => current_user_can('administrator')?true:false
    );
    wp_send_json($result);
    wp_die();
}

add_action('wp_ajax_get_moon_layer', 'get_moon_layer_callback');
add_action("wp_ajax_nopriv_get_moon_layer", "get_moon_layer_callback");

function get_moon_layer_callback(){
    header('content-type: application/json; charset=utf-8');
    global $wpdb;
    $id=$_POST["id"];
    $sql="SELECT * FROM {$wpdb->prefix}moon_layers WHERE id={$id}";
    $layers = $wpdb->get_results($sql, ARRAY_A);
    $sql="SELECT id,title,longitude,latitude FROM {$wpdb->prefix}moon_landmarks WHERE layer_id={$id} ORDER BY title";
    $landmarks = $wpdb->get_results($sql, ARRAY_A);
    $result = array(
        "result" => "success",
        "layers" => $layers,
        "landmarks" => $landmarks,
        "editable" => current_user_can('administrator')?true:false
    );
    wp_send_json($result);
    wp_die();
}


add_action('wp_ajax_add_mars_layer', 'add_mars_layer_callback');
function add_mars_layer_callback(){
  header('content-type: application/json; charset=utf-8');
  global $wpdb;
  if(!current_user_can('administrator')){
     $result = array(
        "result" => "failed",
        "message" => "You can't add layer.",
     );
     wp_send_json($result);
     wp_die();
  }else{
        $filename='';
        if(isset($_FILES['image'])){
            $upload_dir = wp_upload_dir();
            $extension  = pathinfo( $_FILES["image"]["name"], PATHINFO_EXTENSION );
            $filename   = uniqid() . "." . $extension;
            $target_file = $upload_dir['basedir']."/mars_layers/{$filename}";
            move_uploaded_file($_FILES["image"]["tmp_name"], $target_file);
        }
        $row=array(
            'title' => stripslashes($_POST["title"]),
            'image' => $filename,
            'description' => stripslashes($_POST["description"]),
            'category' => stripslashes($_POST["category"]),
            'sub_category' => stripslashes($_POST["sub_category"]),
            'extent' => $_POST["extent"],
            'tiles' => stripslashes($_POST["tiles"]),
            'created_datetime' => date('Y-m-d H:i:s'),
            'updated_datetime' => date('Y-m-d H:i:s')
        );
        $format=array('%s','%s','%s','%s','%s','%s','%s','%s','%s');
        $wpdb->insert("{$wpdb->prefix}mars_layers",$row,$format);
        $new_id = $wpdb->insert_id;
       
        $result = array(
           "result" => "success",
           "id" => $new_id
        );
        wp_send_json($result);
        wp_die();
  }
}

add_action('wp_ajax_add_moon_layer', 'add_moon_layer_callback');
function add_moon_layer_callback(){
  header('content-type: application/json; charset=utf-8');
  global $wpdb;
  if(!current_user_can('administrator')){
     $result = array(
        "result" => "failed",
        "message" => "You can't add layer.",
     );
     wp_send_json($result);
     wp_die();
  }else{
        $filename='';
        if(isset($_FILES['image'])){
            $upload_dir = wp_upload_dir();
            $extension  = pathinfo( $_FILES["image"]["name"], PATHINFO_EXTENSION );
            $filename   = uniqid() . "." . $extension;
            $target_file = $upload_dir['basedir']."/moon_layers/{$filename}";
            move_uploaded_file($_FILES["image"]["tmp_name"], $target_file);
        }
        $row=array(
            'title' => stripslashes($_POST["title"]),
            'image' => $filename,
            'description' => stripslashes($_POST["description"]),
            'category' => stripslashes($_POST["category"]),
            'sub_category' => stripslashes($_POST["sub_category"]),
            'extent' => $_POST["extent"],
            'tiles' => stripslashes($_POST["tiles"]),
            'created_datetime' => date('Y-m-d H:i:s'),
            'updated_datetime' => date('Y-m-d H:i:s')
        );
        $format=array('%s','%s','%s','%s','%s','%s','%s','%s','%s');
        $wpdb->insert("{$wpdb->prefix}moon_layers",$row,$format);
        $new_id = $wpdb->insert_id;
       
        $result = array(
           "result" => "success",
           "id" => $new_id
        );
        wp_send_json($result);
        wp_die();
  }
}

add_action('wp_ajax_update_mars_layer', 'update_mars_layer_callback');
function update_mars_layer_callback(){
    header('content-type: application/json; charset=utf-8');
    global $wpdb;
    if(!current_user_can('administrator')){
        $result = array(
           "result" => "failed",
           "message" => "You can't update layer.",
        );
        wp_send_json($result);
        wp_die();
     }else{
        $filename=$_POST['old_image'];
        if(isset($_FILES['image'])){
            $upload_dir = wp_upload_dir();
            $image_url = $upload_dir['basedir']."/mars_layers/{$filename}";
            wp_delete_file($image_url);
            $extension  = pathinfo( $_FILES["image"]["name"], PATHINFO_EXTENSION );
            $filename   = uniqid() . "." . $extension;
            $target_file = $upload_dir['basedir']."/mars_layers/{$filename}";
            move_uploaded_file($_FILES["image"]["tmp_name"], $target_file);
        }
        $row=array(
           'title' => stripslashes($_POST["title"]),
           'image' => $filename,
           'description' => stripslashes($_POST["description"]),
           'category' => stripslashes($_POST["category"]),
           'sub_category' => stripslashes($_POST["sub_category"]),
           'extent' => $_POST["extent"],
           'tiles' => stripslashes($_POST["tiles"]),
           'updated_datetime' => date('Y-m-d H:i:s')
        );
        $format=array('%s','%s','%s','%s','%s','%s','%s','%s');
        $where = array(
            'id' => $_POST["id"]
        );
        $where_format = array('%d');
        $wpdb->update("{$wpdb->prefix}mars_layers", $row, $where, $format, $where_format);
        get_mars_layer_callback();
     }
}

add_action('wp_ajax_update_moon_layer', 'update_moon_layer_callback');
function update_moon_layer_callback(){
    header('content-type: application/json; charset=utf-8');
    global $wpdb;
    if(!current_user_can('administrator')){
        $result = array(
           "result" => "failed",
           "message" => "You can't update layer.",
        );
        wp_send_json($result);
        wp_die();
     }else{
        $filename=$_POST['old_image'];
        if(isset($_FILES['image'])){
            $upload_dir = wp_upload_dir();
            $image_url = $upload_dir['basedir']."/moon_layers/{$filename}";
            wp_delete_file($image_url);
            $extension  = pathinfo( $_FILES["image"]["name"], PATHINFO_EXTENSION );
            $filename   = uniqid() . "." . $extension;
            $target_file = $upload_dir['basedir']."/moon_layers/{$filename}";
            move_uploaded_file($_FILES["image"]["tmp_name"], $target_file);
        }
        $row=array(
           'title' => stripslashes($_POST["title"]),
           'image' => $filename,
           'description' => stripslashes($_POST["description"]),
           'category' => stripslashes($_POST["category"]),
           'sub_category' => stripslashes($_POST["sub_category"]),
           'extent' => $_POST["extent"],
           'tiles' => stripslashes($_POST["tiles"]),
           'updated_datetime' => date('Y-m-d H:i:s')
        );
        $format=array('%s','%s','%s','%s','%s','%s','%s','%s');
        $where = array(
            'id' => $_POST["id"]
        );
        $where_format = array('%d');
        $wpdb->update("{$wpdb->prefix}moon_layers", $row, $where, $format, $where_format);
        get_moon_layer_callback();
     }
}

add_action('wp_ajax_remove_mars_layer', 'remove_mars_layer_callback');
function remove_mars_layer_callback(){
    header('content-type: application/json; charset=utf-8');
    global $wpdb;
    if(!current_user_can('administrator')){
        $result = array(
            "result" => "failed",
            "message" => "You can't remove layer.",
         );
         wp_send_json($result);
         wp_die();
    }else{
        $where = array('id' => $_POST["id"]);
        $where_format = array('%d');
        $wpdb->delete("{$wpdb->prefix}mars_layers", $where, $where_format);

        $upload_dir = wp_upload_dir();
        $image_url = $upload_dir['basedir']."/mars_layers/{$_POST["image"]}";
        //unlink($file_url);
        wp_delete_file($image_url);
        
        $result = array("result" => "success");
    
        wp_send_json($result);
        wp_die();
    }
}

add_action('wp_ajax_remove_moon_layer', 'remove_moon_layer_callback');
function remove_moon_layer_callback(){
    header('content-type: application/json; charset=utf-8');
    global $wpdb;
    if(!current_user_can('administrator')){
        $result = array(
            "result" => "failed",
            "message" => "You can't remove layer.",
         );
         wp_send_json($result);
         wp_die();
    }else{
        $where = array('id' => $_POST["id"]);
        $where_format = array('%d');
        $wpdb->delete("{$wpdb->prefix}moon_layers", $where, $where_format);

        $upload_dir = wp_upload_dir();
        $image_url = $upload_dir['basedir']."/moon_layers/{$_POST["image"]}";
        //unlink($file_url);
        wp_delete_file($image_url);
        
        $result = array("result" => "success");
    
        wp_send_json($result);
        wp_die();
    }
}

add_action('wp_ajax_get_mars_landmark', 'get_mars_landmark_callback');
add_action("wp_ajax_nopriv_get_mars_landmark", "get_mars_landmark_callback");

function get_mars_landmark_callback(){
    header('content-type: application/json; charset=utf-8');
    global $wpdb;
    $sql="SELECT * FROM {$wpdb->prefix}mars_landmarks WHERE id={$_POST["id"]}";
    $landmarks = $wpdb->get_results($sql, ARRAY_A);
    $result = array(
        "result" => "success",
        "landmarks" => $landmarks,
        "editable" => current_user_can('administrator')?true:false
    );
    wp_send_json($result);
    wp_die();
}


add_action('wp_ajax_get_moon_landmark', 'get_moon_landmark_callback');
add_action("wp_ajax_nopriv_get_moon_landmark", "get_moon_landmark_callback");

function get_moon_landmark_callback(){
    header('content-type: application/json; charset=utf-8');
    global $wpdb;
    $sql="SELECT * FROM {$wpdb->prefix}moon_landmarks WHERE id={$_POST["id"]}";
    $landmarks = $wpdb->get_results($sql, ARRAY_A);
    $result = array(
        "result" => "success",
        "landmarks" => $landmarks,
        "editable" => current_user_can('administrator')?true:false
    );
    wp_send_json($result);
    wp_die();
}

add_action('wp_ajax_add_mars_landmark', 'add_mars_landmark_callback');
function add_mars_landmark_callback(){
  header('content-type: application/json; charset=utf-8');
  global $wpdb;
  if(!current_user_can('administrator')){
     $result = array(
        "result" => "failed",
        "message" => "You can't add landmark.",
     );
     wp_send_json($result);
     wp_die();
  }else{
        $filenames = array();
        if(isset($_FILES['images'])){
            $countfiles = count($_FILES['images']['name']);
            $upload_dir = wp_upload_dir();
            for($i=0;$i<$countfiles;$i++){
                if(isset($_FILES['images']['name'][$i]) && $_FILES['images']['name'][$i] != ''){
                   $filename = $_FILES['images']['name'][$i];
                   $extension = strtolower(pathinfo($filename, PATHINFO_EXTENSION));
                   $filename = uniqid().".".$extension;
                   // File path
                   $target_file = $upload_dir['basedir']."/mars_landmarks/{$filename}";
                   // Upload file
                   move_uploaded_file($_FILES['images']['tmp_name'][$i], $target_file);
                   $filenames[] = $filename;
                }
             }
        }
        $row=array(
            'layer_id' => $_POST["layer_id"],
            'title' => stripslashes($_POST["title"]),
            'image' => stripslashes(json_encode($filenames)),
            'image_title' => stripslashes($_POST["image_title"]),
            'description' => stripslashes($_POST["description"]),
            'longitude' => $_POST["longitude"],
            'latitude' => $_POST["latitude"],
            'created_datetime' => date('Y-m-d H:i:s'),
            'updated_datetime' => date('Y-m-d H:i:s')
        );
        $format=array('%d','%s','%s','%s','%s','%s','%s','%s','%s');
        $wpdb->insert("{$wpdb->prefix}mars_landmarks",$row,$format);
        $new_id = $wpdb->insert_id;
        $result = array(
           "result" => "success",
           "id" => $new_id
        );
        wp_send_json($result);
        wp_die();
  }
}

add_action('wp_ajax_add_moon_landmark', 'add_moon_landmark_callback');
function add_moon_landmark_callback(){
  header('content-type: application/json; charset=utf-8');
  global $wpdb;
  if(!current_user_can('administrator')){
     $result = array(
        "result" => "failed",
        "message" => "You can't add landmark.",
     );
     wp_send_json($result);
     wp_die();
  }else{
        $filenames = array();
        if(isset($_FILES['images'])){
            $countfiles = count($_FILES['images']['name']);
            $upload_dir = wp_upload_dir();
            for($i=0;$i<$countfiles;$i++){
                if(isset($_FILES['images']['name'][$i]) && $_FILES['images']['name'][$i] != ''){
                   $filename = $_FILES['images']['name'][$i];
                   $extension = strtolower(pathinfo($filename, PATHINFO_EXTENSION));
                   $filename = uniqid().".".$extension;
                   // File path
                   $target_file = $upload_dir['basedir']."/moon_landmarks/{$filename}";
                   // Upload file
                   move_uploaded_file($_FILES['images']['tmp_name'][$i], $target_file);
                   $filenames[] = $filename;
                }
             }
        }
        $row=array(
            'layer_id' => $_POST["layer_id"],
            'title' => stripslashes($_POST["title"]),
            'image' => stripslashes(json_encode($filenames)),
            'image_title' => stripslashes($_POST["image_title"]),
            'description' => stripslashes($_POST["description"]),
            'longitude' => $_POST["longitude"],
            'latitude' => $_POST["latitude"],
            'created_datetime' => date('Y-m-d H:i:s'),
            'updated_datetime' => date('Y-m-d H:i:s')
        );
        $format=array('%d','%s','%s','%s','%s','%s','%s','%s','%s');
        $wpdb->insert("{$wpdb->prefix}moon_landmarks",$row,$format);
        $new_id = $wpdb->insert_id;
        $result = array(
           "result" => "success",
           "id" => $new_id
        );
        wp_send_json($result);
        wp_die();
  }
}

add_action('wp_ajax_update_mars_landmark', 'update_mars_landmark_callback');
function update_mars_landmark_callback(){
    header('content-type: application/json; charset=utf-8');
    global $wpdb;
    if(!current_user_can('administrator')){
        $result = array(
           "result" => "failed",
           "message" => "You can't update landmark.",
        );
        wp_send_json($result);
        wp_die();
     }else{
        $image = stripslashes($_POST["old_image"]);
        $filenames = array();
        if(isset($_FILES['images'])){
            $upload_dir = wp_upload_dir();
            $oldImages = json_decode($image, true);
            $countfiles = count($oldImages);
            for($i=0;$i<$countfiles;$i++){
                $image_url = $upload_dir['basedir']."//mars_landmarks//".$oldImages[$i];
                wp_delete_file($image_url);
            }
            $countfiles = count($_FILES['images']['name']);
            for($i=0;$i<$countfiles;$i++){
                if(isset($_FILES['images']['name'][$i]) && $_FILES['images']['name'][$i] != ''){
                   $filename = $_FILES['images']['name'][$i];
                   $extension = strtolower(pathinfo($filename, PATHINFO_EXTENSION));
                   $filename = uniqid().".".$extension;
                   // File path
                   $target_file = $upload_dir['basedir']."/mars_landmarks/{$filename}";
                   // Upload file
                   move_uploaded_file($_FILES['images']['tmp_name'][$i], $target_file);
                   $filenames[] = $filename;
                }
            }

            $image = stripslashes(json_encode($filenames));
        }
        
        $row=array(
            'title' => stripslashes($_POST["title"]),
            'image' => $image,
            'image_title' => stripslashes($_POST["image_title"]),
            'description' => stripslashes($_POST["description"]),
            'longitude' => $_POST["longitude"],
            'latitude' => $_POST["latitude"],
            'updated_datetime' => date('Y-m-d H:i:s')
        );
        $format=array('%s','%s','%s','%s','%s','%s','%s');
        $where = array(
            'id' => $_POST["id"]
        );
        $where_format = array('%d');
        $wpdb->update("{$wpdb->prefix}mars_landmarks", $row, $where, $format, $where_format);
        get_mars_landmark_callback();
     }
}

add_action('wp_ajax_update_moon_landmark', 'update_moon_landmark_callback');
function update_moon_landmark_callback(){
    header('content-type: application/json; charset=utf-8');
    global $wpdb;
    if(!current_user_can('administrator')){
        $result = array(
           "result" => "failed",
           "message" => "You can't update landmark.",
        );
        wp_send_json($result);
        wp_die();
     }else{
        $image = stripslashes($_POST["old_image"]);
        $filenames = array();
        if(isset($_FILES['images'])){
            $upload_dir = wp_upload_dir();
            $oldImages = json_decode($image, true);
            $countfiles = count($oldImages);
            for($i=0;$i<$countfiles;$i++){
                $image_url = $upload_dir['basedir']."//moon_landmarks//".$oldImages[$i];
                wp_delete_file($image_url);
            }
            $countfiles = count($_FILES['images']['name']);
            for($i=0;$i<$countfiles;$i++){
                if(isset($_FILES['images']['name'][$i]) && $_FILES['images']['name'][$i] != ''){
                   $filename = $_FILES['images']['name'][$i];
                   $extension = strtolower(pathinfo($filename, PATHINFO_EXTENSION));
                   $filename = uniqid().".".$extension;
                   // File path
                   $target_file = $upload_dir['basedir']."/moon_landmarks/{$filename}";
                   // Upload file
                   move_uploaded_file($_FILES['images']['tmp_name'][$i], $target_file);
                   $filenames[] = $filename;
                }
            }

            $image = stripslashes(json_encode($filenames));
        }
        
        $row=array(
            'title' => stripslashes($_POST["title"]),
            'image' => $image,
            'image_title' => stripslashes($_POST["image_title"]),
            'description' => stripslashes($_POST["description"]),
            'longitude' => $_POST["longitude"],
            'latitude' => $_POST["latitude"],
            'updated_datetime' => date('Y-m-d H:i:s')
        );
        $format=array('%s','%s','%s','%s','%s','%s','%s');
        $where = array(
            'id' => $_POST["id"]
        );
        $where_format = array('%d');
        $wpdb->update("{$wpdb->prefix}moon_landmarks", $row, $where, $format, $where_format);
        get_moon_landmark_callback();
     }
}

add_action('wp_ajax_remove_mars_landmark', 'remove_mars_landmark_callback');
function remove_mars_landmark_callback(){
    header('content-type: application/json; charset=utf-8');
    global $wpdb;
    if(!current_user_can('administrator')){
        $result = array(
            "result" => "failed",
            "message" => "You can't remove landmark.",
         );
         wp_send_json($result);
         wp_die();
    }else{
        $where = array('id' => $_POST["id"]);
        $where_format = array('%d');
        $wpdb->delete("{$wpdb->prefix}mars_landmarks", $where, $where_format);

        $upload_dir = wp_upload_dir();
        $images = json_decode(stripslashes($_POST["image"]), true);
        $countfiles = count($images);
        
        for($i=0;$i<$countfiles;$i++){
            $image_url = $upload_dir['basedir']."//mars_landmarks//".$images[$i];
            wp_delete_file($image_url);
        }
        
        $result = array("result" => "success");
    
        wp_send_json($result);
        wp_die();
    }
}

add_action('wp_ajax_remove_moon_landmark', 'remove_moon_landmark_callback');
function remove_moon_landmark_callback(){
    header('content-type: application/json; charset=utf-8');
    global $wpdb;
    if(!current_user_can('administrator')){
        $result = array(
            "result" => "failed",
            "message" => "You can't remove landmark.",
         );
         wp_send_json($result);
         wp_die();
    }else{
        $where = array('id' => $_POST["id"]);
        $where_format = array('%d');
        $wpdb->delete("{$wpdb->prefix}moon_landmarks", $where, $where_format);

        $upload_dir = wp_upload_dir();
        $images = json_decode(stripslashes($_POST["image"]), true);
        $countfiles = count($images);
        
        for($i=0;$i<$countfiles;$i++){
            $image_url = $upload_dir['basedir']."//moon_landmarks//".$images[$i];
            wp_delete_file($image_url);
        }
        
        $result = array("result" => "success");
    
        wp_send_json($result);
        wp_die();
    }
}

add_action('wp_ajax_get_mars_parcel', 'get_mars_parcel_callback');
add_action("wp_ajax_nopriv_get_mars_parcel", "get_mars_parcel_callback");

function get_mars_parcel_callback(){
    header('content-type: application/json; charset=utf-8');
    global $wpdb;
    $parcel_id=$_POST["parcel_id"];
    $client_user_id = get_current_user_id();

    //is_user_loggedin()

    $sql_array=array(
        "SELECT",
        "a.parcel_id AS parcel_id,",
        "a.parcel_name AS parcel_name,",
        "a.parcel_description AS parcel_description,",
        "a.parcel_status AS parcel_status,",
        "a.parcel_user_id AS parcel_user_id,",
        "a.parcel_youtube AS parcel_youtube,",
        "a.created_datetime AS created_datetime,",
        "a.updated_datetime AS updated_datetime,",
        "b.user_login AS user_name,",
        "b.user_url AS user_url",
        "FROM",
        "{$wpdb->prefix}mars_parcels as a",
        "LEFT JOIN {$wpdb->prefix}users as b on a.parcel_user_id=b.ID",
        "WHERE a.parcel_id='{$parcel_id}'"
    );
    $sql=join(' ', $sql_array);

    $parcels = $wpdb->get_results($sql, ARRAY_A);

    $user_meta = array();
    if(sizeof($parcels)>0){
        $parcel_user_id = $parcels[0]["parcel_user_id"];
        $user_meta = get_user_meta($parcel_user_id);
    }
    $country = array_key_exists('country', $user_meta) ? $user_meta["country"][0] : '';
    $social_media = array();
    //youtube, facebook, twitter, linkedin, googleplus, instagram, skype
    $social_media["youtube"] = array_key_exists('youtube', $user_meta) ? $user_meta["youtube"][0] : '';
    $social_media["facebook"] = array_key_exists('facebook', $user_meta) ? $user_meta["facebook"][0] : '';
    $social_media["twitter"] = array_key_exists('twitter', $user_meta) ? $user_meta["twitter"][0] : '';
    $social_media["linkedin"] = array_key_exists('linkedin', $user_meta) ? $user_meta["linkedin"][0] : '';
    //$social_media["googleplus"] = array_key_exists('googleplus', $user_meta) ? $user_meta["googleplus"][0] : '';
    $social_media["instagram"] = array_key_exists('instagram', $user_meta) ? $user_meta["instagram"][0] : '';
    $social_media["skype"] = array_key_exists('skype', $user_meta) ? $user_meta["skype"][0] : '';
    
    $result = array(
        "parcels" => $parcels,
        "country" => $country,
        "social_media" => $social_media,
        "client_user_id" => $client_user_id
    );
    wp_send_json($result);
    wp_die();
}

add_action('wp_ajax_get_moon_parcel', 'get_moon_parcel_callback');
add_action("wp_ajax_nopriv_get_moon_parcel", "get_moon_parcel_callback");

function get_moon_parcel_callback(){
    header('content-type: application/json; charset=utf-8');
    global $wpdb;
    $parcel_id=$_POST["parcel_id"];
    $client_user_id = get_current_user_id();

    $sql_array=array(
        "SELECT",
        "a.parcel_id AS parcel_id,",
        "a.parcel_name AS parcel_name,",
        "a.parcel_description AS parcel_description,",
        "a.parcel_status AS parcel_status,",
        "a.parcel_user_id AS parcel_user_id,",
        "a.parcel_youtube AS parcel_youtube,",
        "a.created_datetime AS created_datetime,",
        "a.updated_datetime AS updated_datetime,",
        "b.user_login AS user_name,",
        "b.user_url AS user_url",
        "FROM",
        "{$wpdb->prefix}moon_parcels as a",
        "LEFT JOIN {$wpdb->prefix}users as b on a.parcel_user_id=b.ID",
        "WHERE a.parcel_id='{$parcel_id}'"
    );
    $sql=join(' ', $sql_array);

    $parcels = $wpdb->get_results($sql, ARRAY_A);

    $user_meta = array();
    if(sizeof($parcels)>0){
        $parcel_user_id = $parcels[0]["parcel_user_id"];
        $user_meta = get_user_meta($parcel_user_id);
    }
    $country = array_key_exists('country', $user_meta) ? $user_meta["country"][0] : '';
    $social_media = array();
    //youtube, facebook, twitter, linkedin, googleplus, instagram, skype
    $social_media["youtube"] = array_key_exists('youtube', $user_meta) ? $user_meta["youtube"][0] : '';
    $social_media["facebook"] = array_key_exists('facebook', $user_meta) ? $user_meta["facebook"][0] : '';
    $social_media["twitter"] = array_key_exists('twitter', $user_meta) ? $user_meta["twitter"][0] : '';
    $social_media["linkedin"] = array_key_exists('linkedin', $user_meta) ? $user_meta["linkedin"][0] : '';
    //$social_media["googleplus"] = array_key_exists('googleplus', $user_meta) ? $user_meta["googleplus"][0] : '';
    $social_media["instagram"] = array_key_exists('instagram', $user_meta) ? $user_meta["instagram"][0] : '';
    $social_media["skype"] = array_key_exists('skype', $user_meta) ? $user_meta["skype"][0] : '';
    
    $result = array(
        "parcels" => $parcels,
        "country" => $country,
        "social_media" => $social_media,
        "client_user_id" => $client_user_id
    );
    wp_send_json($result);
    wp_die();
}

add_action('wp_ajax_get_mars_parcel_ids', 'get_mars_parcel_ids_callback');
add_action('wp_ajax_nopriv_get_mars_parcel_ids', 'get_mars_parcel_ids_callback');
function get_mars_parcel_ids_callback(){
    header('content-type: application/json; charset=utf-8');
    global $wpdb;
    $parcel_ids=stripslashes($_POST["parcel_ids"]);

    $result = $wpdb->get_results("SELECT parcel_id FROM {$wpdb->prefix}mars_parcels WHERE parcel_id IN({$parcel_ids})", ARRAY_A);
    
    wp_send_json($result);
    wp_die();
}

add_action('wp_ajax_get_moon_parcel_ids', 'get_moon_parcel_ids_callback');
add_action('wp_ajax_nopriv_get_moon_parcel_ids', 'get_moon_parcel_ids_callback');
function get_moon_parcel_ids_callback(){
    header('content-type: application/json; charset=utf-8');
    global $wpdb;
    $parcel_ids=stripslashes($_POST["parcel_ids"]);

    $result = $wpdb->get_results("SELECT parcel_id FROM {$wpdb->prefix}moon_parcels WHERE parcel_id IN({$parcel_ids})", ARRAY_A);
    
    wp_send_json($result);
    wp_die();
}

add_action('wp_ajax_add_mars_parcel', 'add_mars_parcel_callback');
function add_mars_parcel_callback(){
  header('content-type: application/json; charset=utf-8');
  global $wpdb;
  if(isset($_FILES['parcel_image'])){
      $uploadedfile = $_FILES['parcel_image'];
      $upload_dir = wp_upload_dir();
      $target_file = $upload_dir['basedir']."/mars_parcels/{$_FILES["parcel_image"]["name"]}";
      if ( move_uploaded_file($_FILES["parcel_image"]["tmp_name"], $target_file)) {
          //file is uploaded successfully. do next steps here.
          $row=array(
                'parcel_id' => $_POST["parcel_id"],
                'parcel_name' => stripslashes($_POST["parcel_name"]),
                'parcel_description' => stripslashes($_POST["parcel_description"]),
                'parcel_user_id' => get_current_user_id(),
                'parcel_status' => $_POST["parcel_status"],
                'parcel_youtube' => stripslashes($_POST["parcel_youtube"]),
                'created_datetime' => date('Y-m-d H:i:s'),
                'updated_datetime' => date('Y-m-d H:i:s')
          );
          $format=array('%s','%s','%s','%d','%s','%s','%s','%s');
          $wpdb->insert("{$wpdb->prefix}mars_parcels",$row,$format);
        
          get_mars_parcel_callback();
      }
  }
}

add_action('wp_ajax_add_moon_parcel', 'add_moon_parcel_callback');
function add_moon_parcel_callback(){
  header('content-type: application/json; charset=utf-8');
  global $wpdb;
  if(isset($_FILES['parcel_image'])){
      $uploadedfile = $_FILES['parcel_image'];
      $upload_dir = wp_upload_dir();
      $target_file = $upload_dir['basedir']."/moon_parcels/{$_FILES["parcel_image"]["name"]}";
      if ( move_uploaded_file($_FILES["parcel_image"]["tmp_name"], $target_file)) {
          //file is uploaded successfully. do next steps here.
          $row=array(
                'parcel_id' => $_POST["parcel_id"],
                'parcel_name' => stripslashes($_POST["parcel_name"]),
                'parcel_description' => stripslashes($_POST["parcel_description"]),
                'parcel_user_id' => get_current_user_id(),
                'parcel_status' => $_POST["parcel_status"],
                'parcel_youtube' => stripslashes($_POST["parcel_youtube"]),
                'created_datetime' => date('Y-m-d H:i:s'),
                'updated_datetime' => date('Y-m-d H:i:s')
          );
          $format=array('%s','%s','%s','%d','%s','%s','%s','%s');
          $wpdb->insert("{$wpdb->prefix}moon_parcels",$row,$format);
        
          get_moon_parcel_callback();
      }
  }
}

add_action('wp_ajax_update_mars_parcel', 'update_mars_parcel_callback');
function update_mars_parcel_callback(){
    header('content-type: application/json; charset=utf-8');
    global $wpdb;
    if(isset($_FILES['parcel_image'])){
        $uploadedfile = $_FILES['parcel_image'];
        $upload_dir = wp_upload_dir();
        $target_file = $upload_dir['basedir']."/mars_parcels/{$_FILES["parcel_image"]["name"]}";
        move_uploaded_file($_FILES["parcel_image"]["tmp_name"], $target_file);
    }
    $row=array(
       'parcel_name' => $_POST["parcel_name"],
       'parcel_description' => stripslashes($_POST["parcel_description"]),
       'parcel_status' => $_POST["parcel_status"],
       'parcel_youtube' => stripslashes($_POST["parcel_youtube"]),
       'updated_datetime' => date('Y-m-d H:i:s')
    );
    $format=array('%s','%s','%s','%s','%s');
    $where = array(
        'parcel_id' => $_POST["parcel_id"],
        'parcel_user_id' => get_current_user_id()
    );
    $where_format = array('%s','%d');
    $wpdb->update("{$wpdb->prefix}mars_parcels", $row, $where, $format, $where_format);
    get_mars_parcel_callback();
}

add_action('wp_ajax_update_moon_parcel', 'update_moon_parcel_callback');
function update_moon_parcel_callback(){
    header('content-type: application/json; charset=utf-8');
    global $wpdb;
    if(isset($_FILES['parcel_image'])){
        $uploadedfile = $_FILES['parcel_image'];
        $upload_dir = wp_upload_dir();
        $target_file = $upload_dir['basedir']."/moon_parcels/{$_FILES["parcel_image"]["name"]}";
        move_uploaded_file($_FILES["parcel_image"]["tmp_name"], $target_file);
    }
    $row=array(
        'parcel_name' => $_POST["parcel_name"],
        'parcel_description' => stripslashes($_POST["parcel_description"]),
        'parcel_status' => $_POST["parcel_status"],
        'parcel_youtube' => stripslashes($_POST["parcel_youtube"]),
        'updated_datetime' => date('Y-m-d H:i:s')
    );
    $format=array('%s','%s','%s','%s','%s');
    $where = array(
        'parcel_id' => $_POST["parcel_id"],
        'parcel_user_id' => get_current_user_id()
    );
    $where_format = array('%s','%d');
    $wpdb->update("{$wpdb->prefix}moon_parcels", $row, $where, $format, $where_format);
    get_moon_parcel_callback();
}

add_action('wp_ajax_remove_mars_parcel', 'remove_mars_parcel_callback');
function remove_mars_parcel_callback(){
    header('content-type: application/json; charset=utf-8');
    global $wpdb;
    $parcel_id=stripslashes($_POST["parcel_id"]);
    $userID = get_current_user_id();
    $where = array(
        'parcel_id' => $_POST["parcel_id"],
        'parcel_user_id' => $userID
    );
    $where_format = array('%s','%d');
    $wpdb->delete("{$wpdb->prefix}mars_parcels", $where, $where_format);
    
    $upload_dir = wp_upload_dir();
    $image_url = $upload_dir['basedir']."/mars_parcels/{$parcel_id}.jpg";
    //unlink($file_url);
    wp_delete_file($image_url);
    
    $result = array("result" => "success");

    wp_send_json($result);
    wp_die();
}

add_action('wp_ajax_remove_moon_parcel', 'remove_moon_parcel_callback');
function remove_moon_parcel_callback(){
    header('content-type: application/json; charset=utf-8');
    global $wpdb;
    $parcel_id=stripslashes($_POST["parcel_id"]);
    $userID = get_current_user_id();
    $where = array(
        'parcel_id' => $_POST["parcel_id"],
        'parcel_user_id' => $userID
    );
    $where_format = array('%s','%d');
    $wpdb->delete("{$wpdb->prefix}moon_parcels", $where, $where_format);
    
    $upload_dir = wp_upload_dir();
    $image_url = $upload_dir['basedir']."/moon_parcels/{$parcel_id}.jpg";
    //unlink($file_url);
    wp_delete_file($image_url);
    
    $result = array("result" => "success");

    wp_send_json($result);
    wp_die();
}

add_action('wp_ajax_search_mars_parcels', 'search_mars_parcels_callback');
add_action('wp_ajax_nopriv_search_mars_parcels', 'search_mars_parcels_callback');
function search_mars_parcels_callback(){
    header('content-type: application/json; charset=utf-8');
    global $wpdb;
    $search_input = $_GET["search_input"];
    $sql_array=array(
        "SELECT",
        "a.parcel_id AS parcel_id,",
        "a.parcel_name AS parcel_name,",
        "b.user_login AS user_name",
        "FROM",
        "{$wpdb->prefix}mars_parcels as a",
        "LEFT JOIN {$wpdb->prefix}users as b on a.parcel_user_id=b.ID",
        "WHERE a.parcel_name LIKE '%{$search_input}%' OR b.user_login LIKE '%{$search_input}%'",
        "LIMIT 10"
    );
    $sql=join(' ', $sql_array);

    $result = $wpdb->get_results($sql, ARRAY_A);

    wp_send_json($result);
    wp_die();
}

add_action('wp_ajax_search_moon_parcels', 'search_moon_parcels_callback');
add_action('wp_ajax_nopriv_search_moon_parcels', 'search_moon_parcels_callback');
function search_moon_parcels_callback(){
    header('content-type: application/json; charset=utf-8');
    global $wpdb;
    $search_input = $_GET["search_input"];
    $sql_array=array(
        "SELECT",
        "a.parcel_id AS parcel_id,",
        "a.parcel_name AS parcel_name,",
        "b.user_login AS user_name",
        "FROM",
        "{$wpdb->prefix}moon_parcels as a",
        "LEFT JOIN {$wpdb->prefix}users as b on a.parcel_user_id=b.ID",
        "WHERE a.parcel_name LIKE '%{$search_input}%' OR b.user_login LIKE '%{$search_input}%'",
        "LIMIT 10"
    );
    $sql=join(' ', $sql_array);

    $result = $wpdb->get_results($sql, ARRAY_A);

    wp_send_json($result);
    wp_die();
}