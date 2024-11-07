<template lang="pug">
//- button
section.componet-wrap
  h2 Button
  button.btn(type="button") Button

  button.btn.lg(type="button") Button
  button.btn.sm(type="button") Button
  button.btn.xs(type="button") Button
  button.btn.xs(type="button" disabled) Button

  button.btn.outline(type="button") Button
  button.btn.lg.outline(type="button") Button
  button.btn.outline(type="button" disabled) Button

  button.btn.bg-gray(type="button") Button
  button.btn.bg-gray.outline(type="button") Button
  button.btn.bg-gray.outline(type="button" disabled) Button
  button.btn.bg-gray(type="button" disabled) Button

  button.btn(type="button")
    i.icon-hand
    | Button
    i.icon-hand

  button.btn.outline(type="button")
    i.icon-hand
    | Button
    i.icon-hand

  button.btn.bg-gray(type="button")
    i.icon-hand
    | Button
    i.icon-hand

  button.btn.bg-gray.outline(type="button")
    i.icon-hand
    | Button
    i.icon-hand

//- input
section.componet-wrap
  h2 input
  .input-wrap
    input(type="text" placeholder="입력하세요.")

  .input-wrap
    input(type="text" placeholder="입력하세요." disabled)

  .input-wrap.warning
    //- 필수사항 경우 .label클래스에 'essential'클래스 할당
    p.label.essential Text
    input(type="text" placeholder="입력하세요.")

//- Textarea
section.componet-wrap
  h2 Textarea
  .input-wrap
    textarea(name="" id="" placeholder="내용을 입력하세요.")

  .input-wrap
    textarea(name="" id="" placeholder="내용을 입력하세요." disabled)

//- selectbox
section.componet-wrap
  h2 selectbox
  .input-wrap
    p.label.essential 권한
    select(name="selectbox1" required)
        option(disabled selected) 권한선택
        option(value="1") 직원
        option(value="98") 관리자
        option(value="99") 마스터

  .input-wrap
    p.label.essential 권한
    select(name="selectbox2" disabled required)
        option(disabled selected) 권한선택
        option(value="1") 직원
        option(value="98") 관리자
        option(value="99") 마스터

//- Form
section.componet-wrap
  h2 Form
  //- checkbox
  label.checkbox
    input(type="checkbox" name="checkbox" checked)
    span.label-checkbox 테스트입니다.

  label.checkbox.circle
    input(type="checkbox" name="checkbox")
    span.label-checkbox 테스트입니다.

  //- radio button
  label.radio-button
    input(type="radio" name="radio1" checked)
    span.label-radio TEST1
  label.radio-button
    input(type="radio" name="radio1")
    span.label-radio TEST2

  //- toggle switch btn
  label.switch-button
    input(type="checkbox")
    span.label-switch
</template>

<script setup lang="ts">

</script>

<style scoped lang="less">
.componet-wrap {
  border: 1px solid #999;
  padding: 1rem;
  margin: 1rem;
  display: flex;
  flex-direction: column;
  gap: 1rem;

  &:first-of-type {
    display: block;
  }

  h2 {
    // font-size: 1.25rem;
    font-weight: 600;
    margin-bottom: 1rem;
  }
}
</style>