<?php
/**
 * The template for displaying the footer
 *
 * Contains footer content and the closing of the #main and #page div elements.
 *
 * @package i-craft
 * @since i-craft 1.0
 */

$default_copyright = 'Copyright &copy; '.get_bloginfo( 'name' ) ;
$no_footer = "";
if ( function_exists( 'rwmb_meta' ) ) {
	$no_footer = rwmb_meta('icraft_no_footer');
} 
$top_phone = '';
$top_email = '';
$top_phone = esc_attr(get_theme_mod('top_phone', '1-000-123-4567'));
$top_email = esc_attr(get_theme_mod('top_email', 'email@i-create.com'));
?>

		</div><!-- #main -->
		<footer id="colophon" class="site-footer" role="contentinfo">
        <?php if( $no_footer != 1 ) : ?>
        	<div class="footer-bg clearfix">
                <div class="widget-wrap">
                    <?php get_sidebar( 'main' ); ?>
                </div>
			</div>
        <?php endif; ?>    
			<div class="site-info">
                <div class="copyright">
                	<?php //esc_attr_e( 'Copyright &copy;', 'i-craft' ); ?>  <?php //bloginfo( 'name' ); ?>
                    <?php echo esc_attr(get_theme_mod('copyright_text', $default_copyright )); ?>
                </div>            
            	<div class="credit-info">
					<span>
						<?php printf( __( 'Phone: '.$top_phone, 'i-craft' ), 'WordPress' ); ?>
                    </span>
                    <?php printf( __( ' | ', 'i-craft' )); ?> 
                    <span>
                   		<?php printf( __( 'Email: '.$top_email, 'i-craft' ) ); ?>
					</span>
					<?php printf( __( ' | ', 'i-craft' )); ?> 
					<div class="socialicons">
						<?php echo icraft_social_icons(); ?>
					</div>
                </div>

			</div><!-- .site-info -->
		</footer><!-- #colophon -->
	</div><!-- #page -->

	<?php wp_footer(); ?>
</body>
</html>