import type { FormSchema } from '../../src/runtime/core/types'

/** Neutral product-catalog style schema (no GRC/ERP/gov domains). */
export const catalogSchema: FormSchema = [
  {
    type: 'section',
    key: 'basics',
    title: 'Product basics',
    children: [
      { key: 'title', type: 'text', label: 'Title', rules: { required: true, maxLength: 80 } },
      { key: 'secret', type: 'password', label: 'Secret code' },
      { key: 'qty', type: 'number', label: 'Quantity', rules: { min: 1, integer: true } },
      {
        key: 'color',
        type: 'select',
        label: 'Color',
        options: { items: [
          { label: 'Red', value: 'red' },
          { label: 'Blue', value: 'blue' },
          { label: 'Green', value: 'green' },
        ] },
      },
      { key: 'release_date', type: 'date', label: 'Release date' },
      { key: 'featured', type: 'switch', label: 'Featured' },
      { key: 'agree', type: 'checkbox', label: 'I agree to the listing terms', rules: { required: true } },
    ],
  },
]

export const treeSchema: FormSchema = [
  {
    key: 'category',
    type: 'tree-select',
    label: 'Category',
    clearable: true,
    options: {
      expandAll: true,
      items: [
        {
          label: 'Kitchen',
          value: 'kitchen',
          children: [
            { label: 'Cookware', value: 'cookware' },
            { label: 'Bakeware', value: 'bakeware' },
          ],
        },
        {
          label: 'Outdoor',
          value: 'outdoor',
          children: [
            { label: 'Camping', value: 'camping' },
            { label: 'Garden', value: 'garden' },
          ],
        },
      ],
    },
  },
]

export const cascadeSchema: FormSchema = [
  {
    key: 'region',
    type: 'select',
    label: 'Region',
    options: {
      items: [
        { label: 'North', value: 'north' },
        { label: 'South', value: 'south' },
      ],
    },
  },
  {
    key: 'city',
    type: 'select',
    label: 'City',
    options: {
      source: 'cities',
      dependsOn: ['region'],
      params: { region: '{{region}}' },
    },
  },
]

export const collapsibleSchema: FormSchema = [
  {
    type: 'section',
    key: 'extra',
    title: 'Extra details',
    description: 'Optional notes for the listing',
    collapsible: true,
    defaultOpen: true,
    children: [
      { key: 'notes', type: 'textarea', label: 'Notes' },
    ],
  },
]

export function fieldEl(root: Element | Document, key: string) {
  return root.querySelector(`[data-sf-field="${key}"]`)
}
