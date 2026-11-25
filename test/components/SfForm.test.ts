import { mountSuspended, renderSuspended } from '@nuxt/test-utils/runtime'
import { flushPromises } from '@vue/test-utils'
import { describe, expect, it, vi } from 'vitest'
import { defineComponent, h, nextTick, ref } from 'vue'
import SfForm from '../../src/runtime/components/Form.vue'
import { catalogSchema, fieldEl } from './helpers'

describe('SfForm', () => {
  it('renders fields from a schema', async () => {
    const wrapper = await mountSuspended(SfForm, {
      props: {
        schema: catalogSchema,
        modelValue: {},
        locale: 'en',
      },
    })
    await flushPromises()

    expect(fieldEl(wrapper.element, 'title')).toBeTruthy()
    expect(fieldEl(wrapper.element, 'secret')).toBeTruthy()
    expect(fieldEl(wrapper.element, 'qty')).toBeTruthy()
    expect(fieldEl(wrapper.element, 'color')).toBeTruthy()
    expect(fieldEl(wrapper.element, 'release_date')).toBeTruthy()
    expect(fieldEl(wrapper.element, 'featured')).toBeTruthy()
    expect(fieldEl(wrapper.element, 'agree')).toBeTruthy()
    expect(wrapper.text()).toContain('Product basics')
    expect(wrapper.text()).toContain('Title')
  })

  it('updates v-model when a text field changes', async () => {
    const model = ref<Record<string, unknown>>({})
    const Host = defineComponent({
      setup() {
        return () => h(SfForm, {
          schema: catalogSchema,
          modelValue: model.value,
          'onUpdate:modelValue': (v: Record<string, unknown>) => {
            model.value = v
          },
          locale: 'en',
        })
      },
    })

    const wrapper = await mountSuspended(Host)
    await flushPromises()

    const input = fieldEl(wrapper.element, 'title')?.querySelector('input')
    expect(input).toBeTruthy()
    await wrapper.get('[data-sf-field="title"] input').setValue('Ceramic mug')
    await flushPromises()
    await nextTick()

    expect(model.value.title).toBe('Ceramic mug')
  })

  it('emits submit with payload when valid', async () => {
    const onSubmit = vi.fn()
    const wrapper = await mountSuspended(SfForm, {
      props: {
        schema: [
          { key: 'title', type: 'text', label: 'Title', rules: { required: true } },
          { key: 'agree', type: 'checkbox', label: 'Agree', rules: { required: true } },
        ],
        modelValue: { title: 'Notebook', agree: true },
        submitLabel: 'Save',
        locale: 'en',
        onSubmit,
      },
    })
    await flushPromises()

    // Prefer exposed submit() — UButton click → native form submit is flaky in happy-dom.
    await (wrapper.vm as { submit: () => Promise<void> }).submit()
    await flushPromises()

    expect(onSubmit).toHaveBeenCalledTimes(1)
    const [payload] = onSubmit.mock.calls[0]!
    expect(payload).toMatchObject({ title: 'Notebook', agree: true })
  })

  it('shows validation errors and emits error on invalid submit', async () => {
    const onError = vi.fn()
    const onSubmit = vi.fn()
    const wrapper = await mountSuspended(SfForm, {
      props: {
        schema: [
          { key: 'title', type: 'text', label: 'Title', rules: { required: true } },
        ],
        modelValue: {},
        submitLabel: 'Save',
        locale: 'en',
        focusOnError: false,
        onError,
        onSubmit,
      },
    })
    await flushPromises()

    await (wrapper.vm as { submit: () => Promise<void> }).submit()
    await flushPromises()
    await nextTick()

    expect(onSubmit).not.toHaveBeenCalled()
    expect(onError).toHaveBeenCalled()
    expect(wrapper.text()).toMatch(/required/i)
  })

  it('focusOnError focuses the first invalid field', async () => {
    const focus = vi.fn()
    const scrollIntoView = vi.fn()
    const originalFocus = HTMLElement.prototype.focus
    const originalScroll = HTMLElement.prototype.scrollIntoView
    HTMLElement.prototype.focus = focus
    HTMLElement.prototype.scrollIntoView = scrollIntoView

    try {
      const wrapper = await mountSuspended(SfForm, {
        props: {
          schema: [
            { key: 'title', type: 'text', label: 'Title', rules: { required: true } },
            { key: 'qty', type: 'number', label: 'Qty', rules: { required: true } },
          ],
          modelValue: {},
          submitLabel: 'Save',
          locale: 'en',
          focusOnError: true,
        },
        attachTo: document.body,
      })
      await flushPromises()

      await (wrapper.vm as { submit: () => Promise<void> }).submit()
      await flushPromises()
      await nextTick()

      expect(focus).toHaveBeenCalled()
      expect(scrollIntoView).toHaveBeenCalledWith({ behavior: 'smooth', block: 'center' })
    }
    finally {
      HTMLElement.prototype.focus = originalFocus
      HTMLElement.prototype.scrollIntoView = originalScroll
    }
  })

  it('maps server errors onto fields', async () => {
    const wrapper = await mountSuspended(SfForm, {
      props: {
        schema: [
          { key: 'title', type: 'text', label: 'Title' },
          { key: 'sku', type: 'text', label: 'SKU' },
        ],
        modelValue: { title: 'Mug', sku: 'MUG-1' },
        locale: 'en',
        serverErrors: [{ field: 'sku', message: 'SKU already taken' }],
      },
    })
    await flushPromises()
    await nextTick()
    await flushPromises()

    expect(wrapper.text()).toContain('SKU already taken')
  })

  it('view mode renders values as display text, not inputs', async () => {
    const wrapper = await mountSuspended(SfForm, {
      props: {
        schema: [
          { key: 'title', type: 'text', label: 'Title' },
          { key: 'featured', type: 'switch', label: 'Featured' },
          { key: 'secret', type: 'password', label: 'Secret' },
        ],
        modelValue: { title: 'Ceramic mug', featured: true, secret: 'hidden-value' },
        mode: 'view',
        locale: 'en',
      },
    })
    await flushPromises()

    expect(wrapper.find('[data-sf-display="title"]').text()).toContain('Ceramic mug')
    expect(wrapper.find('[data-sf-display="featured"]').text()).toMatch(/Yes/i)
    expect(wrapper.find('[data-sf-display="secret"]').text()).toContain('••••••••')
    expect(wrapper.find('[data-sf-field="title"] input').exists()).toBe(false)
    expect(wrapper.find('button[type="submit"]').exists()).toBe(false)
  })

  it('SSR-renders SfForm markup with field markers', async () => {
    const result = await renderSuspended(SfForm, {
      props: {
        schema: [
          { key: 'title', type: 'text', label: 'Title' },
        ],
        modelValue: { title: 'SSR mug' },
        locale: 'en',
      },
    })
    const html = result.html()
    expect(html).toContain('data-sf-field="title"')
    expect(html).toContain('sf-form')
  })
})
