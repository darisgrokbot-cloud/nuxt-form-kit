import { defineComponent } from 'vue'
import type { PropType, Slot } from 'vue'

/** render slot ที่ส่งต่อมาจาก <SfForm> (ข้าม component หลายชั้น) */
export default defineComponent({
  name: 'FkSlotOutlet',
  props: {
    slotFn: { type: Function as PropType<Slot>, required: true },
    slotProps: { type: Object, default: () => ({}) },
  },
  setup(props) {
    return () => props.slotFn(props.slotProps)
  },
})
