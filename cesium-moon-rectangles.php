<?php
/**
 * Template Name: Cesium-Moon-Rectangles
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
    <div id="cesiumContainer">
        <div id="coordinates" class="cesium-panel"></div>
        <div id="altitude" class="cesium-panel"></div>
        <div id="toolTip" class="cesium-panel"></div>
        <div id="toolbar" class="cesium-panel">
          <table>
              <tbody>
                <tr>
                    <td>
                      <label>
                        <input type="checkbox" data-bind="checked: show" style="margin-right:5px">
                        <span>Visible Pictures<span>
                      </label>
                    </td>
                    <td><input type="range" class="slider" min="0" max="1" step="0.1" data-bind="value: alpha, valueUpdate: 'input'"></td>
                </tr>
              </tbody>
          </table>
        </div>
    </div>
  </div><!-- #main -->
</div><!-- #page -->

<?php wp_footer(); ?>

</body>
</html>