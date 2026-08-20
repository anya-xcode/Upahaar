import { Router } from 'express';
import * as products from '../controllers/productController.js';
import * as location from '../controllers/locationController.js';
import * as catalog from '../controllers/catalogController.js';
import * as reviews from '../controllers/reviewController.js';
import { optionalAuth } from '../middleware/auth.js';

const router = Router();

// Every storefront route is browsable signed-out, but uses the customer's saved
// pincode when a token happens to be present.
router.use(optionalAuth);

/* --- Location: the entry point to the whole experience --- */
router.get('/location/check', location.checkPincode);
router.get('/location/suggest', location.suggestPincodes);
router.get('/location/cities', location.serviceableCities);

/* --- Products --- */
router.get('/products', products.listProducts);
router.get('/products/feed', products.productFeed);
router.get('/products/filters', products.filterOptions);
router.get('/products/search/suggest', products.suggest);
router.get('/products/:slug', products.getProduct);

/* --- Catalog & CMS --- */
router.get('/catalog/categories', catalog.listCategories);
router.get('/catalog/occasions', catalog.listOccasions);
router.get('/catalog/banners', catalog.listBanners);
router.get('/catalog/faqs', catalog.listFaqs);
router.get('/catalog/posts', catalog.listPosts);
router.get('/catalog/posts/:slug', catalog.getPost);
router.get('/catalog/sellers', catalog.listSellers);
router.get('/catalog/sellers/:slug', catalog.getSeller);
router.get('/catalog/coupons', catalog.listPublicCoupons);

/* --- Reviews (read-only) --- */
router.get('/reviews', reviews.listReviews);

export default router;
