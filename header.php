<?php
/**
 * The Header template for our theme
 *
 * Displays all of the <head> section and everything up till <div id="main">
 *
 * @package i-craft
 * @since i-craft 1.0
 */
?>
<?php

$hide_cart = get_theme_mod('hide_cart', 0);

$top_phone = '';
$top_email = '';
$ubar_class = '';
$nav_dropdown_class = '';
$whatsapp_url = esc_url('https://api.whatsapp.com/send?phone=');

$top_phone = esc_attr(get_theme_mod('top_phone', '1-000-123-4567'));
$top_email = esc_attr(get_theme_mod('top_email', 'email@example.com'));
$icraft_logo = get_theme_mod( 'logo', get_template_directory_uri() . '/images/logo-black-2.png' );
$icraft_logo_trans = get_theme_mod( 'logo_trans', get_template_directory_uri() . '/images/logo-white-2.png' );

$nav_dropdown = get_theme_mod('nav_dropdown', 1);

if ( $nav_dropdown == 1 ) {
	$nav_dropdown_class = "colored-drop";
}

$clickable_phnem = get_theme_mod( 'clickable_phnem', 0);
$wide_topbar = get_theme_mod( 'wide_topbar', 0);

if ( $wide_topbar == 1 ) {
	$ubar_class = "wide-ubar";
}

global $post;

$no_page_header = 0;
$custom_logo_normal = $custom_logo_reverse = '';

if ( function_exists( 'rwmb_meta' ) ) { 

	$no_page_header = rwmb_meta('icraft_no_page_header');
	if(rwmb_meta( 'icraft_page_logo_normal' )) {
		$custom_logo_normal = rwmb_meta( 'icraft_page_logo_normal', '' );
		$icraft_logo = $custom_logo_normal['full_url'];
	}
	if(rwmb_meta( 'icraft_page_logo_trans' )) {
		$custom_logo_reverse = rwmb_meta( 'icraft_page_logo_trans', '' );
		$icraft_logo_trans = $custom_logo_reverse['full_url'];
	}	
}

?>

<!DOCTYPE html>
<html <?php language_attributes(); ?>>
<head>
	<meta charset="<?php bloginfo( 'charset' ); ?>">
	<meta name="viewport" content="width=device-width">

	<?php    
    if ( ! function_exists( '_wp_render_title_tag' ) ) :
        function icraft_render_title() {
    ?>
    <title><?php wp_title( '|', true, 'right' ); ?></title>
    <?php
        }
        add_action( 'wp_head', 'icraft_render_title' );
    endif;    
    ?>    
    
	<link rel="profile" href="http://gmpg.org/xfn/11">
	<link rel="pingback" href="<?php bloginfo( 'pingback_url' ); ?>">
	<?php wp_head(); ?>
</head>
<body <?php body_class(); ?>>
	<?php wp_body_open(); ?>
	<div class="nx-ispload">
        <div class="nx-ispload-wrap">
            <div class="nx-folding-cube">
                <div class="nx-cube1 nx-cube"></div>
                <div class="nx-cube2 nx-cube"></div>
                <div class="nx-cube4 nx-cube"></div>
                <div class="nx-cube3 nx-cube"></div>
            </div>
        </div>    
    </div>
	<div id="page" class="hfeed site">
    	
        <?php if ( $top_phone || $top_email || icraft_social_icons() ) : ?>
    	<div id="utilitybar" class="utilitybar <?php echo esc_attr($ubar_class); ?>">
        	<div class="ubarinnerwrap">
                <div class="socialicons">
                    <?php echo icraft_social_icons(); ?>
                </div>
                <?php if ( $top_phone ) : ?>
                <div class="topphone">
                    <i class="topbarico genericon genericon-phone"></i>
                    <?php if( $clickable_phnem ) : ?>
                    	<?php echo '<a href="'.$whatsapp_url.str_replace("-", "", $top_phone).'" target="_blank">'.$top_phone.'</a>'; ?>
                    <?php else : ?>    
                    	<?php echo $top_phone; ?>
                    <?php endif; ?> 
                </div>
                <?php endif; ?>
                
                <?php if ( $top_email ) : ?>
                <div class="topphone">
                    <i class="topbarico genericon genericon-mail"></i>
                    <?php if( $clickable_phnem ) : ?>
                        <?php echo '<a href="mailto:'.$top_email.'" target="_blank">'.$top_email.'</a>'; ?>
                    <?php else : ?>
                    	<?php echo $top_email; ?>
                    <?php endif; ?> 
                </div>
                <?php endif; ?> 
                
                <?php if ( function_exists('pll_the_languages') ) : ?>
               	<?php echo icraft_polylang_switcher(); ?>
                <?php endif; ?>
                                               
            </div> 
        </div>
        <?php endif; ?>
        
        <?php if ( $no_page_header == 0 ) : ?>
        <div class="headerwrap">
            <header id="masthead" class="site-header" role="banner">
         		<div class="headerinnerwrap">

					<?php if ( $icraft_logo && $icraft_logo_trans ) : ?>
                        <a class="home-link" href="<?php echo esc_url( home_url( '/' ) ); ?>" title="<?php echo esc_attr( get_bloginfo( 'name', 'display' ) ); ?>" rel="home">
                            <span><img src="<?php echo $icraft_logo; ?>" alt="<?php bloginfo( 'name' ); ?>" class="icraft-logo normal-logo" /></span>
                            <span><img src="<?php echo $icraft_logo_trans; ?>" alt="<?php bloginfo( 'name' ); ?>" class="icraft-logo trans-logo" /></span>
                        </a>
					<?php elseif ($icraft_logo) : ?>
                        <a class="home-link" href="<?php echo esc_url( home_url( '/' ) ); ?>" title="<?php echo esc_attr( get_bloginfo( 'name', 'display' ) ); ?>" rel="home">
                            <span><img src="<?php echo $icraft_logo; ?>" alt="<?php bloginfo( 'name' ); ?>" class="icraft-logo" /></span>
                        </a>
					<?php elseif ($icraft_logo_trans) : ?>
                        <a class="home-link" href="<?php echo esc_url( home_url( '/' ) ); ?>" title="<?php echo esc_attr( get_bloginfo( 'name', 'display' ) ); ?>" rel="home">
                            <span><img src="<?php echo $icraft_logo_trans; ?>" alt="<?php bloginfo( 'name' ); ?>" class="icraft-logo" /></span>
                        </a>
                    <?php else : ?>
                        <span id="site-titlendesc">
                            <a class="home-link" href="<?php echo esc_url( home_url( '/' ) ); ?>" title="<?php echo esc_attr( get_bloginfo( 'name', 'display' ) ); ?>" rel="home">
                                <h1 class="site-title"><?php bloginfo( 'name' ); ?></h1>
                                <h2 class="site-description"><?php bloginfo( 'description' ); ?></h2>   
                            </a>
                        </span>
                    <?php endif; ?>	
        
                    <div id="navbar" class="navbar <?php echo $nav_dropdown_class; ?>">
                        <nav id="site-navigation" class="navigation main-navigation" role="navigation">
                            <h3 class="menu-toggle"><?php _e( 'Menu', 'i-craft' ); ?></h3>
                            <a class="screen-reader-text skip-link" href="#content" title="<?php esc_attr_e( 'Skip to content', 'i-craft' ); ?>"><?php _e( 'Skip to content', 'i-craft' ); ?></a>
                            <?php 
								if ( has_nav_menu(  'primary' ) ) {
										wp_nav_menu( array( 'theme_location' => 'primary', 'menu_class' => 'nav-menu', 'container_class' => 'nav-container', 'container' => 'div' ) );
									}
									else
									{
										wp_nav_menu( array( 'theme_location' => 'primary', 'menu_class' => 'nav-container' ) ); 
									}
								?>
							
                        </nav><!-- #site-navigation -->

                        
                        <?php
                        global $woocommerce;
                        if ( in_array( 'woocommerce/woocommerce.php', apply_filters( 'active_plugins', get_option( 'active_plugins' ) ) ) && empty($hide_cart) ) {
                        ?>
                        <div class="header-iconwrap">
                            <div class="header-icons woocart">
                                <a href="<?php echo wc_get_cart_url() ?>" >
                                    <span class="show-sidr"><?php _e('Cart','i-craft'); ?></span>
                                    <span class="genericon genericon-cart"></span>
                                    <span class="cart-counts"><?php echo sprintf($woocommerce->cart->cart_contents_count); ?></span>
                                </a>
                                <?php echo icraft_top_cart(); ?>
                            </div>
                        </div>
                        <?php	
                        }
                        ?>
                        
                        <?php if ( get_theme_mod('show_search', 1) == 1 ) : ?>            
                        <div class="topsearch">
                            <?php get_search_form(); ?>
                        </div>
                        <?php endif; ?>	
                    </div><!-- #navbar -->
                    <div class="clear"></div>
                </div>
            </header><!-- #masthead -->
        </div>
        <?php endif; ?>
        
        <!-- #Banner -->
        <?php
		
		$hide_title = $show_slider = $other_slider = $custom_title = $hide_breadcrumb = $smart_slider_3 = "";
		if ( function_exists( 'rwmb_meta' ) ) {
			$hide_title = rwmb_meta('icraft_hidetitle');
			$show_slider = rwmb_meta('icraft_show_slider');
			$other_slider = rwmb_meta('icraft_other_slider');
			$custom_title = rwmb_meta('icraft_customtitle');
			$hide_breadcrumb = rwmb_meta('icraft_hide_breadcrumb');	
			$smart_slider_3 = rwmb_meta('icraft_smart_slider');		
		}
		
		$hide_front_slider = get_theme_mod('slider_stat', 0);
		$other_front_slider = htmlspecialchars_decode(get_theme_mod('other_front_slider', ''));
		$itrans_slogan = get_theme_mod('banner_text', 'Banner Text Here');
		
		if( $smart_slider_3 ) {
			$other_slider = '[smartslider3 slider='.$smart_slider_3.']';
		}
		
		if( $other_slider ) :
		?>		
            <div class="other-slider" style="">
                <?php echo do_shortcode( $other_slider ) ?>
            </div>
      	<?php 
		elseif ( $show_slider ) : 
			icraft_ibanner_slider(); 
		elseif ( is_home() || ((in_array( 'woocommerce/woocommerce.php', apply_filters( 'active_plugins', get_option( 'active_plugins' ) ) ) && is_shop()) ) ) : 
		?>
            <?php if (!empty($other_front_slider)) : ?>
            <?php echo do_shortcode( $other_front_slider ) ?>
        	<?php elseif (!$hide_front_slider) : ?>
            <?php icraft_ibanner_slider(); ?>
        	<?php else : ?>
                <div class="iheader" style="">
                    <div class="titlebar">
                        <h1 class="entry-title">
                            <?php
                                if ($itrans_slogan) {
                                                //bloginfo( 'name' );
                                    echo esc_attr($itrans_slogan);
                                }
                            ?>	                 
                        </h1>
                    </div>
                </div>                                    
        	<?php endif; ?>
            
        <?php elseif(!$hide_title) : ?>
        
        <div class="iheader nx-titlebar" style="">
        	<div class="titlebar">
            	
                <?php
					if ( in_array( 'woocommerce/woocommerce.php', apply_filters( 'active_plugins', get_option( 'active_plugins' ) ) ) && is_woocommerce() ) {	
						echo '<h1 class="entry-title">';
						if ( is_product() && empty($custom_title) ) {
							the_title();
						} else {
							woocommerce_page_title();
						}
						echo '</h1>';
						
					} elseif( is_archive() ) {
						echo '<h1 class="entry-title">';
							if ( is_day() ) :
								printf( __( 'Daily Archives: %s', 'i-craft' ), get_the_date() );
							elseif ( is_month() ) :
								printf( __( 'Monthly Archives: %s', 'i-craft' ), get_the_date( _x( 'F Y', 'monthly archives date format', 'i-craft' ) ) );
							elseif ( is_year() ) :
								printf( __( 'Yearly Archives: %s', 'i-craft' ), get_the_date( _x( 'Y', 'yearly archives date format', 'i-craft' ) ) );
							elseif ( is_category() ) :	
								printf( __( 'Category Archives: %s', 'i-craft' ), single_cat_title( '', false ) );
							else :
								_e( 'Archives', 'i-craft' );
							endif;                						
						echo '</h1>';
					} elseif ( is_search() )
					{
						echo '<h1 class="entry-title">';
							printf( __( 'Search Results for: %s', 'i-craft' ), get_search_query() );					
						echo '</h1>';
					} else {
						if ( !empty($custom_title) ) {
							echo '<h1 class="entry-title">'.esc_attr($custom_title).'</h1>';
						} else {
							echo '<h1 class="entry-title">';
							the_title();
							echo '</h1>';
						}						
					}
					
					echo '<div class="nx-breadcrumb">';
					if ( function_exists('yoast_breadcrumb') ) {
					  	yoast_breadcrumb();
					} elseif( function_exists('bctx_display') && !$hide_breadcrumb ) {
						bctx_display(); 
                    } elseif( function_exists('bcn_display') && !$hide_breadcrumb ) {
						bcn_display();
                    } elseif ( in_array( 'woocommerce/woocommerce.php', apply_filters( 'active_plugins', get_option( 'active_plugins' ) ) ) && is_woocommerce() ) {
						woocommerce_breadcrumb();
					}
					echo '</div>';
                ?> 
            	
            </div>
        </div>
        
		<?php endif; ?>
		<div id="main" class="site-main">

