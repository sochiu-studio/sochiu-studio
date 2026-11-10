import * as migration_20261110_072224_initial from './20261110_072224_initial';
import * as migration_20261110_073926_home_page from './20261110_073926_home_page';
import * as migration_20261110_081049_inquiries from './20261110_081049_inquiries';
import * as migration_20261110_081809_product_materials from './20261110_081809_product_materials';
import * as migration_20261110_082516_fabric_thumbnail from './20261110_082516_fabric_thumbnail';
import * as migration_20261110_083101_review_product_name from './20261110_083101_review_product_name';
import * as migration_20261110_083614_pages_collections from './20261110_083614_pages_collections';
import * as migration_20261110_084011_collection_gallery from './20261110_084011_collection_gallery';

export const migrations = [
  {
    up: migration_20261110_072224_initial.up,
    down: migration_20261110_072224_initial.down,
    name: '20261110_072224_initial',
  },
  {
    up: migration_20261110_073926_home_page.up,
    down: migration_20261110_073926_home_page.down,
    name: '20261110_073926_home_page',
  },
  {
    up: migration_20261110_081049_inquiries.up,
    down: migration_20261110_081049_inquiries.down,
    name: '20261110_081049_inquiries',
  },
  {
    up: migration_20261110_081809_product_materials.up,
    down: migration_20261110_081809_product_materials.down,
    name: '20261110_081809_product_materials',
  },
  {
    up: migration_20261110_082516_fabric_thumbnail.up,
    down: migration_20261110_082516_fabric_thumbnail.down,
    name: '20261110_082516_fabric_thumbnail',
  },
  {
    up: migration_20261110_083101_review_product_name.up,
    down: migration_20261110_083101_review_product_name.down,
    name: '20261110_083101_review_product_name',
  },
  {
    up: migration_20261110_083614_pages_collections.up,
    down: migration_20261110_083614_pages_collections.down,
    name: '20261110_083614_pages_collections',
  },
  {
    up: migration_20261110_084011_collection_gallery.up,
    down: migration_20261110_084011_collection_gallery.down,
    name: '20261110_084011_collection_gallery'
  },
];
