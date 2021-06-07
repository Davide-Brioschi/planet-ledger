<?php
/**
 * Template Name: Cesium-Moon
 * The template for displaying all pages
 *
 * This is the template that displays all pages by default.
 * Please note that this is the WordPress construct of pages and that other
 * 'pages' on your WordPress site will use a different template.
 *
 * @package i-craft
 * @since i-craft 1.0
 */

get_header();

?>
    <div id="sidebar">
        <button id="sidebar-close-button"><i class="fa fa-chevron-left"></i></button>
        <div id="list-layers-box">
            <div class="list-header">
                <div class="list-header-title">
                    <?php if(current_user_can('administrator')){ ?>
                        <button id="add-layer-button" title="Add Layer"><i class="fa fa-plus" aria-hidden="true"></i></button>
                    <?php } ?>
                    Landing Sites
                </div>
                <input type="text" class="search" placeholder="Search" />
            </div>
            <ul class="list-content list" id="list-layers"></ul>
        </div>
        <div id="list-landmarks-box">
            <div class="list-header">
                <div class="list-header-title">
                    <?php if(current_user_can('administrator')){ ?>
                    <button id="add-landmark-button" title="Add Layer"><i class="fa fa-plus" aria-hidden="true"></i></button>
                    <?php } ?>
                    Landmarks
                </div>
                <input type="text" class="search" placeholder="Search" />
            </div>
            <ul class="list-content list" id="list-landmarks"></ul>
        </div>              
    </div>
    <div id="cesiumContainer">
        <div class="menu-bar">
            <button id="sidebar-menu-button" title="Landmarks Listings"><i class="fa fa-bars" aria-hidden="true"></i></button>
            <div id="opacity-bar" class="cesium-panel">
                <span style="margin-right:10px">Opacity</span>
                <input type="range" class="slider" min="0.1" max="0.9" step="0.1" data-bind="value: alpha, valueUpdate: 'input'">
            </div>    
        </div>
        <div id="coordinates" class="cesium-panel"></div>
        <div id="altitude" class="cesium-panel"></div>
    </div>
  </div><!-- #main -->
</div><!-- #page -->

<?php wp_footer(); ?>

</body>
</html>