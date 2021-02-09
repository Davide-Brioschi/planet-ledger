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
    if(is_page('mars-rectangles') || is_page('moon-rectangles') || is_page('mars-hexagons') || is_page('moon-hexagons')){
        wp_enqueue_style( 'cesium-widgets-style',  get_stylesheet_directory_uri().'/Cesium-1.75/Build/Cesium/Widgets/widgets.css', 'icraft-child-style', time(), 'all');
        wp_enqueue_style( 'cesium-InfoBoxDescription-style',  get_stylesheet_directory_uri().'/Cesium-1.75/Build/Cesium/Widgets/InfoBox/InfoBoxDescription.css', 'cesium-widgets-style', time(), 'all');
        wp_enqueue_style( 'cesium-sandcastle-style',  get_stylesheet_directory_uri().'/Cesium-1.75/Apps/Sandcastle/templates/bucket.css', 'cesium-InfoBoxDescription-style', time(), 'all');
        wp_enqueue_style( 'cesium-map-style',  get_stylesheet_directory_uri().'/assets/css/cesium-map.css', 'cesium-sandcastle-style', time(), 'all');
    }
}

add_action('wp_enqueue_scripts','cesium_map_scripts');

function cesium_map_scripts(){
    if(is_page('mars-rectangles') || is_page('moon-rectangles') || is_page('mars-hexagons') || is_page('moon-hexagons')){
        wp_enqueue_script( 'numeral-script', '//cdnjs.cloudflare.com/ajax/libs/numeral.js/2.0.6/numeral.min.js', array(), time(), true );
        wp_enqueue_script( 'cesium-script', get_stylesheet_directory_uri().'/Cesium-1.75/Build/Cesium/Cesium.js', array(), time(), true );
        wp_enqueue_script( 'sandcastle-script', get_stylesheet_directory_uri().'/Cesium-1.75/Apps/Sandcastle/Sandcastle-header.js', array(), time(), true );
        $upload_dir = wp_upload_dir();
        $data=array(
            'siteUrl' => site_url(),
            'ajaxUrl' => admin_url('admin-ajax.php'),
            'baseUrl' => get_stylesheet_directory_uri(),
            'uploadUrl' => $upload_dir['baseurl'],
        );
        wp_localize_script('sandcastle-script', 'site_resource', $data );

    }
    if(is_page('mars-rectangles')){
        wp_enqueue_script( 'cesium-mars-rectangles-map-script', get_stylesheet_directory_uri().'/assets/js/cesium-mars-rectangles.js', 'sandcastle-script', time(), true );
    }
    if(is_page('mars-hexagons')){
        wp_enqueue_script( 'hexasphere', get_stylesheet_directory_uri().'/assets/js/hexasphere/hexasphere.js', 'sandcastle-script', time(), true );
        wp_enqueue_script( 'cesium-mars-hexagons-map-script', get_stylesheet_directory_uri().'/assets/js/cesium-mars-hexagons.js', 'hexasphere', time(), true );
    }
    if(is_page('moon-rectangles')){
        wp_enqueue_script( 'cesium-moon-rectangles-map-script', get_stylesheet_directory_uri().'/assets/js/cesium-moon-rectangles.js', 'sandcastle-script', time(), true );
    }
    if(is_page('moon-hexagons')){
        wp_enqueue_script( 'hexasphere', get_stylesheet_directory_uri().'/assets/js/hexasphere/hexasphere.js', 'sandcastle-script', time(), true );
        wp_enqueue_script( 'cesium-moon-rectangles-map-script', get_stylesheet_directory_uri().'/assets/js/cesium-moon-hexagons.js', 'hexasphere', time(), true );
    }

}

add_action('wp_ajax_get_mars_rectangles_parcel', 'get_mars_rectangles_parcel_callback');
add_action("wp_ajax_nopriv_get_mars_rectangles_parcel", "get_mars_rectangles_parcel_callback");

function get_mars_rectangles_parcel_callback(){
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
        "{$wpdb->prefix}mars_rectangles as a",
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

    $social_media = array();
    //youtube, facebook, twitter, linkedin, googleplus, instagram, skype
    $social_media["youtube"] = array_key_exists('youtube', $user_meta) ? $user_meta["youtube"][0] : '';
    $social_media["facebook"] = array_key_exists('facebook', $user_meta) ? $user_meta["facebook"][0] : '';
    $social_media["twitter"] = array_key_exists('twitter', $user_meta) ? $user_meta["twitter"][0] : '';
    $social_media["linkedin"] = array_key_exists('linkedin', $user_meta) ? $user_meta["linkedin"][0] : '';
    $social_media["googleplus"] = array_key_exists('googleplus', $user_meta) ? $user_meta["googleplus"][0] : '';
    $social_media["instagram"] = array_key_exists('instagram', $user_meta) ? $user_meta["instagram"][0] : '';
    $social_media["skype"] = array_key_exists('skype', $user_meta) ? $user_meta["skype"][0] : '';
    
    $result = array(
        "parcels" => $parcels,
        "social_media" => $social_media,
        "client_user_id" => $client_user_id
    );
    wp_send_json($result);
    wp_die();
}

add_action('wp_ajax_get_mars_hexagons_parcel', 'get_mars_hexagons_parcel_callback');
add_action("wp_ajax_nopriv_get_mars_hexagons_parcel", "get_mars_hexagons_parcel_callback");

function get_mars_hexagons_parcel_callback(){
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
        "{$wpdb->prefix}mars_hexagons as a",
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

    $social_media = array();
    //youtube, facebook, twitter, linkedin, googleplus, instagram, skype
    $social_media["youtube"] = array_key_exists('youtube', $user_meta) ? $user_meta["youtube"][0] : '';
    $social_media["facebook"] = array_key_exists('facebook', $user_meta) ? $user_meta["facebook"][0] : '';
    $social_media["twitter"] = array_key_exists('twitter', $user_meta) ? $user_meta["twitter"][0] : '';
    $social_media["linkedin"] = array_key_exists('linkedin', $user_meta) ? $user_meta["linkedin"][0] : '';
    $social_media["googleplus"] = array_key_exists('googleplus', $user_meta) ? $user_meta["googleplus"][0] : '';
    $social_media["instagram"] = array_key_exists('instagram', $user_meta) ? $user_meta["instagram"][0] : '';
    $social_media["skype"] = array_key_exists('skype', $user_meta) ? $user_meta["skype"][0] : '';
    
    $result = array(
        "parcels" => $parcels,
        "social_media" => $social_media,
        "client_user_id" => $client_user_id
    );
    wp_send_json($result);
    wp_die();
}

add_action('wp_ajax_get_moon_rectangles_parcel', 'get_moon_rectangles_parcel_callback');
add_action("wp_ajax_nopriv_get_moon_rectangles_parcel", "get_moon_rectangles_parcel_callback");

function get_moon_rectangles_parcel_callback(){
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
        "{$wpdb->prefix}moon_rectangles as a",
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

    $social_media = array();
    //youtube, facebook, twitter, linkedin, googleplus, instagram, skype
    $social_media["youtube"] = array_key_exists('youtube', $user_meta) ? $user_meta["youtube"][0] : '';
    $social_media["facebook"] = array_key_exists('facebook', $user_meta) ? $user_meta["facebook"][0] : '';
    $social_media["twitter"] = array_key_exists('twitter', $user_meta) ? $user_meta["twitter"][0] : '';
    $social_media["linkedin"] = array_key_exists('linkedin', $user_meta) ? $user_meta["linkedin"][0] : '';
    $social_media["googleplus"] = array_key_exists('googleplus', $user_meta) ? $user_meta["googleplus"][0] : '';
    $social_media["instagram"] = array_key_exists('instagram', $user_meta) ? $user_meta["instagram"][0] : '';
    $social_media["skype"] = array_key_exists('skype', $user_meta) ? $user_meta["skype"][0] : '';
    
    $result = array(
        "parcels" => $parcels,
        "social_media" => $social_media,
        "client_user_id" => $client_user_id
    );
    wp_send_json($result);
    wp_die();
}

add_action('wp_ajax_get_moon_hexagons_parcel', 'get_moon_hexagons_parcel_callback');
add_action("wp_ajax_nopriv_get_moon_hexagons_parcel", "get_moon_hexagons_parcel_callback");

function get_moon_hexagons_parcel_callback(){
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
        "{$wpdb->prefix}moon_hexagons as a",
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

    $social_media = array();
    //youtube, facebook, twitter, linkedin, googleplus, instagram, skype
    $social_media["youtube"] = array_key_exists('youtube', $user_meta) ? $user_meta["youtube"][0] : '';
    $social_media["facebook"] = array_key_exists('facebook', $user_meta) ? $user_meta["facebook"][0] : '';
    $social_media["twitter"] = array_key_exists('twitter', $user_meta) ? $user_meta["twitter"][0] : '';
    $social_media["linkedin"] = array_key_exists('linkedin', $user_meta) ? $user_meta["linkedin"][0] : '';
    $social_media["googleplus"] = array_key_exists('googleplus', $user_meta) ? $user_meta["googleplus"][0] : '';
    $social_media["instagram"] = array_key_exists('instagram', $user_meta) ? $user_meta["instagram"][0] : '';
    $social_media["skype"] = array_key_exists('skype', $user_meta) ? $user_meta["skype"][0] : '';
    
    $result = array(
        "parcels" => $parcels,
        "social_media" => $social_media,
        "client_user_id" => $client_user_id
    );
    wp_send_json($result);
    wp_die();
}

add_action('wp_ajax_get_mars_rectangles_parcel_ids', 'get_mars_rectangles_parcel_ids_callback');
add_action('wp_ajax_nopriv_get_mars_rectangles_parcel_ids', 'get_mars_rectangles_parcel_ids_callback');
function get_mars_rectangles_parcel_ids_callback(){
    header('content-type: application/json; charset=utf-8');
    global $wpdb;
    $parcel_ids=stripslashes($_POST["parcel_ids"]);

    $result = $wpdb->get_results("SELECT parcel_id FROM {$wpdb->prefix}mars_rectangles WHERE parcel_id IN({$parcel_ids})", ARRAY_A);
    
    wp_send_json($result);
    wp_die();
}

add_action('wp_ajax_get_mars_hexagons_parcel_ids', 'get_mars_hexagons_parcel_ids_callback');
add_action('wp_ajax_nopriv_get_mars_hexagons_parcel_ids', 'get_mars_hexagons_parcel_ids_callback');
function get_mars_hexagons_parcel_ids_callback(){
    header('content-type: application/json; charset=utf-8');
    global $wpdb;
    $parcel_ids=stripslashes($_POST["parcel_ids"]);

    $result = $wpdb->get_results("SELECT parcel_id FROM {$wpdb->prefix}mars_hexagons WHERE parcel_id IN({$parcel_ids})", ARRAY_A);
    
    wp_send_json($result);
    wp_die();
}

add_action('wp_ajax_get_moon_rectangles_parcel_ids', 'get_moon_rectangles_parcel_ids_callback');
add_action('wp_ajax_nopriv_get_moon_rectangles_parcel_ids', 'get_moon_rectangles_parcel_ids_callback');
function get_moon_rectangles_parcel_ids_callback(){
    header('content-type: application/json; charset=utf-8');
    global $wpdb;
    $parcel_ids=stripslashes($_POST["parcel_ids"]);

    $result = $wpdb->get_results("SELECT parcel_id FROM {$wpdb->prefix}moon_rectangles WHERE parcel_id IN({$parcel_ids})", ARRAY_A);
    
    wp_send_json($result);
    wp_die();
}

add_action('wp_ajax_get_moon_hexagons_parcel_ids', 'get_moon_hexagons_parcel_ids_callback');
add_action('wp_ajax_nopriv_get_moon_hexagons_parcel_ids', 'get_moon_hexagons_parcel_ids_callback');
function get_moon_hexagons_parcel_ids_callback(){
    header('content-type: application/json; charset=utf-8');
    global $wpdb;
    $parcel_ids=stripslashes($_POST["parcel_ids"]);

    $result = $wpdb->get_results("SELECT parcel_id FROM {$wpdb->prefix}moon_hexagons WHERE parcel_id IN({$parcel_ids})", ARRAY_A);
    
    wp_send_json($result);
    wp_die();
}

add_action('wp_ajax_add_mars_rectangles_parcel', 'add_mars_rectangles_parcel_callback');
function add_mars_rectangles_parcel_callback(){
  header('content-type: application/json; charset=utf-8');
  global $wpdb;
  if(isset($_FILES['parcel_image'])){
      $uploadedfile = $_FILES['parcel_image'];
      $upload_dir = wp_upload_dir();
      $target_file = $upload_dir['basedir']."/mars-rectangles/{$_FILES["parcel_image"]["name"]}";
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
          $wpdb->insert("{$wpdb->prefix}mars_rectangles",$row,$format);
        
          get_mars_rectangles_parcel_callback();
      }
  }
}

add_action('wp_ajax_add_mars_hexagons_parcel', 'add_mars_hexagons_parcel_callback');
function add_mars_hexagons_parcel_callback(){
  header('content-type: application/json; charset=utf-8');
  global $wpdb;
  if(isset($_FILES['parcel_image'])){
      $uploadedfile = $_FILES['parcel_image'];
      $upload_dir = wp_upload_dir();
      $target_file = $upload_dir['basedir']."/mars-hexagons/{$_FILES["parcel_image"]["name"]}";
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
          $wpdb->insert("{$wpdb->prefix}mars_hexagons",$row,$format);
        
          get_mars_hexagons_parcel_callback();
      }
  }
}

add_action('wp_ajax_add_moon_rectangles_parcel', 'add_moon_rectangles_parcel_callback');
function add_moon_rectangles_parcel_callback(){
  header('content-type: application/json; charset=utf-8');
  global $wpdb;
  if(isset($_FILES['parcel_image'])){
      $uploadedfile = $_FILES['parcel_image'];
      $upload_dir = wp_upload_dir();
      $target_file = $upload_dir['basedir']."/moon-rectangles/{$_FILES["parcel_image"]["name"]}";
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
          $wpdb->insert("{$wpdb->prefix}moon_rectangles",$row,$format);
        
          get_moon_rectangles_parcel_callback();
      }
  }
}

add_action('wp_ajax_add_moon_hexagons_parcel', 'add_moon_hexagons_parcel_callback');
function add_moon_hexagons_parcel_callback(){
  header('content-type: application/json; charset=utf-8');
  global $wpdb;
  if(isset($_FILES['parcel_image'])){
      $uploadedfile = $_FILES['parcel_image'];
      $upload_dir = wp_upload_dir();
      $target_file = $upload_dir['basedir']."/moon-hexagons/{$_FILES["parcel_image"]["name"]}";
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
          $wpdb->insert("{$wpdb->prefix}moon_hexagons",$row,$format);
        
          get_moon_hexagons_parcel_callback();
      }
  }
}

add_action('wp_ajax_update_mars_rectangles_parcel', 'update_mars_rectangles_parcel_callback');
function update_mars_rectangles_parcel_callback(){
    header('content-type: application/json; charset=utf-8');
    global $wpdb;
    if(isset($_FILES['parcel_image'])){
        $uploadedfile = $_FILES['parcel_image'];
        $upload_dir = wp_upload_dir();
        $target_file = $upload_dir['basedir']."/mars-rectangles/{$_FILES["parcel_image"]["name"]}";
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
    $wpdb->update("{$wpdb->prefix}mars_rectangles", $row, $where, $format, $where_format);
    get_mars_rectangles_parcel_callback();
}

add_action('wp_ajax_update_mars_hexagons_parcel', 'update_mars_hexagons_parcel_callback');
function update_mars_hexagons_parcel_callback(){
    header('content-type: application/json; charset=utf-8');
    global $wpdb;
    if(isset($_FILES['parcel_image'])){
        $uploadedfile = $_FILES['parcel_image'];
        $upload_dir = wp_upload_dir();
        $target_file = $upload_dir['basedir']."/mars-hexagons/{$_FILES["parcel_image"]["name"]}";
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
    $wpdb->update("{$wpdb->prefix}mars_hexagons", $row, $where, $format, $where_format);
    get_mars_hexagons_parcel_callback();
}

add_action('wp_ajax_update_moon_rectangles_parcel', 'update_moon_rectangles_parcel_callback');
function update_moon_rectangles_parcel_callback(){
    header('content-type: application/json; charset=utf-8');
    global $wpdb;
    if(isset($_FILES['parcel_image'])){
        $uploadedfile = $_FILES['parcel_image'];
        $upload_dir = wp_upload_dir();
        $target_file = $upload_dir['basedir']."/moon-rectangles/{$_FILES["parcel_image"]["name"]}";
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
    $wpdb->update("{$wpdb->prefix}moon_rectangles", $row, $where, $format, $where_format);
    get_moon_rectangles_parcel_callback();
}

add_action('wp_ajax_update_moon_hexagons_parcel', 'update_moon_hexagons_parcel_callback');
function update_moon_hexagons_parcel_callback(){
    header('content-type: application/json; charset=utf-8');
    global $wpdb;
    if(isset($_FILES['parcel_image'])){
        $uploadedfile = $_FILES['parcel_image'];
        $upload_dir = wp_upload_dir();
        $target_file = $upload_dir['basedir']."/moon-hexagons/{$_FILES["parcel_image"]["name"]}";
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
    $wpdb->update("{$wpdb->prefix}moon_hexagons", $row, $where, $format, $where_format);
    get_moon_hexagons_parcel_callback();
}


add_action('wp_ajax_remove_mars_rectangles_parcel', 'remove_mars_rectangles_parcel_callback');
function remove_mars_rectangles_parcel_callback(){
    header('content-type: application/json; charset=utf-8');
    global $wpdb;
    $parcel_id=stripslashes($_POST["parcel_id"]);
    $userID = get_current_user_id();
    $where = array(
        'parcel_id' => $_POST["parcel_id"],
        'parcel_user_id' => $userID
    );
    $where_format = array('%s','%d');
    $wpdb->delete("{$wpdb->prefix}mars_rectangles", $where, $where_format);
    
    $upload_dir = wp_upload_dir();
    $image_url = $upload_dir['basedir']."/mars-rectangles/{$parcel_id}.png";
    //unlink($file_url);
    wp_delete_file($image_url);
    
    $result = array("result" => "success");

    wp_send_json($result);
    wp_die();
}

add_action('wp_ajax_remove_mars_hexagons_parcel', 'remove_mars_hexagons_parcel_callback');
function remove_mars_hexagons_parcel_callback(){
    header('content-type: application/json; charset=utf-8');
    global $wpdb;
    $parcel_id=stripslashes($_POST["parcel_id"]);
    $userID = get_current_user_id();
    $where = array(
        'parcel_id' => $_POST["parcel_id"],
        'parcel_user_id' => $userID
    );
    $where_format = array('%s','%d');
    $wpdb->delete("{$wpdb->prefix}mars_hexagons", $where, $where_format);
    
    $upload_dir = wp_upload_dir();
    $image_url = $upload_dir['basedir']."/mars-hexagons/{$parcel_id}.png";
    //unlink($file_url);
    wp_delete_file($image_url);
    
    $result = array("result" => "success");

    wp_send_json($result);
    wp_die();
}

add_action('wp_ajax_remove_moon_rectangles_parcel', 'remove_moon_rectangles_parcel_callback');
function remove_moon_rectangles_parcel_callback(){
    header('content-type: application/json; charset=utf-8');
    global $wpdb;
    $parcel_id=stripslashes($_POST["parcel_id"]);
    $userID = get_current_user_id();
    $where = array(
        'parcel_id' => $_POST["parcel_id"],
        'parcel_user_id' => $userID
    );
    $where_format = array('%s','%d');
    $wpdb->delete("{$wpdb->prefix}moon_rectangles", $where, $where_format);
    
    $upload_dir = wp_upload_dir();
    $image_url = $upload_dir['basedir']."/moon-rectangles/{$parcel_id}.png";
    //unlink($file_url);
    wp_delete_file($image_url);
    
    $result = array("result" => "success");

    wp_send_json($result);
    wp_die();
}

add_action('wp_ajax_remove_moon_hexagons_parcel', 'remove_moon_hexagons_parcel_callback');
function remove_moon_hexagons_parcel_callback(){
    header('content-type: application/json; charset=utf-8');
    global $wpdb;
    $parcel_id=stripslashes($_POST["parcel_id"]);
    $userID = get_current_user_id();
    $where = array(
        'parcel_id' => $_POST["parcel_id"],
        'parcel_user_id' => $userID
    );
    $where_format = array('%s','%d');
    $wpdb->delete("{$wpdb->prefix}moon_hexagons", $where, $where_format);
    
    $upload_dir = wp_upload_dir();
    $image_url = $upload_dir['basedir']."/moon-hexagons/{$parcel_id}.png";
    //unlink($file_url);
    wp_delete_file($image_url);
    
    $result = array("result" => "success");

    wp_send_json($result);
    wp_die();
}

add_action('wp_ajax_search_mars_rectangles_parcels', 'search_mars_rectangles_parcels_callback');
add_action('wp_ajax_nopriv_search_mars_rectangles_parcels', 'search_mars_rectangles_parcels_callback');
function search_mars_rectangles_parcels_callback(){
    header('content-type: application/json; charset=utf-8');
    global $wpdb;
    $search_input = $_GET["search_input"];
    $sql_array=array(
        "SELECT",
        "a.parcel_id AS parcel_id,",
        "a.parcel_name AS parcel_name,",
        "b.user_login AS user_name",
        "FROM",
        "{$wpdb->prefix}mars_rectangles as a",
        "LEFT JOIN {$wpdb->prefix}users as b on a.parcel_user_id=b.ID",
        "WHERE a.parcel_name LIKE '%{$search_input}%' OR b.user_login LIKE '%{$search_input}%'",
        "LIMIT 10"
    );
    $sql=join(' ', $sql_array);

    $result = $wpdb->get_results($sql, ARRAY_A);

    wp_send_json($result);
    wp_die();
}

add_action('wp_ajax_search_mars_hexagons_parcels', 'search_mars_hexagons_parcels_callback');
add_action('wp_ajax_nopriv_search_mars_hexagons_parcels', 'search_mars_hexagons_parcels_callback');
function search_mars_hexagons_parcels_callback(){
    header('content-type: application/json; charset=utf-8');
    global $wpdb;
    $search_input = $_GET["search_input"];
    $sql_array=array(
        "SELECT",
        "a.parcel_id AS parcel_id,",
        "a.parcel_name AS parcel_name,",
        "b.user_login AS user_name",
        "FROM",
        "{$wpdb->prefix}mars_hexagons as a",
        "LEFT JOIN {$wpdb->prefix}users as b on a.parcel_user_id=b.ID",
        "WHERE a.parcel_name LIKE '%{$search_input}%' OR b.user_login LIKE '%{$search_input}%'",
        "LIMIT 10"
    );
    $sql=join(' ', $sql_array);

    $result = $wpdb->get_results($sql, ARRAY_A);

    wp_send_json($result);
    wp_die();
}

add_action('wp_ajax_search_moon_rectangles_parcels', 'search_moon_rectangles_parcels_callback');
add_action('wp_ajax_nopriv_search_moon_rectangles_parcels', 'search_moon_rectangles_parcels_callback');
function search_moon_rectangles_parcels_callback(){
    header('content-type: application/json; charset=utf-8');
    global $wpdb;
    $search_input = $_GET["search_input"];
    $sql_array=array(
        "SELECT",
        "a.parcel_id AS parcel_id,",
        "a.parcel_name AS parcel_name,",
        "b.user_login AS user_name",
        "FROM",
        "{$wpdb->prefix}moon_rectangles as a",
        "LEFT JOIN {$wpdb->prefix}users as b on a.parcel_user_id=b.ID",
        "WHERE a.parcel_name LIKE '%{$search_input}%' OR b.user_login LIKE '%{$search_input}%'",
        "LIMIT 10"
    );
    $sql=join(' ', $sql_array);

    $result = $wpdb->get_results($sql, ARRAY_A);

    wp_send_json($result);
    wp_die();
}

add_action('wp_ajax_search_moon_hexagons_parcels', 'search_moon_hexagons_parcels_callback');
add_action('wp_ajax_nopriv_search_moon_hexagons_parcels', 'search_moon_hexagons_parcels_callback');
function search_moon_hexagons_parcels_callback(){
    header('content-type: application/json; charset=utf-8');
    global $wpdb;
    $search_input = $_GET["search_input"];
    $sql_array=array(
        "SELECT",
        "a.parcel_id AS parcel_id,",
        "a.parcel_name AS parcel_name,",
        "b.user_login AS user_name",
        "FROM",
        "{$wpdb->prefix}moon_hexagons as a",
        "LEFT JOIN {$wpdb->prefix}users as b on a.parcel_user_id=b.ID",
        "WHERE a.parcel_name LIKE '%{$search_input}%' OR b.user_login LIKE '%{$search_input}%'",
        "LIMIT 10"
    );
    $sql=join(' ', $sql_array);

    $result = $wpdb->get_results($sql, ARRAY_A);

    wp_send_json($result);
    wp_die();
}