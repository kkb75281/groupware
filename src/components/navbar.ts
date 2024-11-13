import { ref, watch } from 'vue';

export const isFolded = ref(false); // 메뉴 접힘 상태
export const isOpen = ref(false); // 메뉴 열림 상태

export function toggleNavbarFold() {
  if (isOpen.value) {
    isOpen.value = !isOpen.value;
    document.body.classList.toggle('open', isOpen.value);
  } else {
    isFolded.value = !isFolded.value;
    document.body.classList.toggle('fold', isFolded.value);
  }
}

export function toggleOpen() {
  isOpen.value = !isOpen.value;
  document.body.classList.toggle('open', isOpen.value);
}

export function checkScreenWidth() {
  if (window.innerWidth <= 1200) {
    document.body.classList.remove('fold', isFolded.value);
  }
}
