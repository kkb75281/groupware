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

//- table
section.componet-wrap
	h2 selectbox
	.table-wrap
		.tb-head-wrap
			.input-wrap.search
				input(type="text" name="" placeholder="회원명, 직급, 아이디 검색")
				button.btn-search(type="button")

			.input-wrap
				select
					option(value="") 10개
					option(value="") 20개
					option(value="") 30개

			.tb-toolbar
				.btn-wrap
					button.btn.outline.md(type="button") 등록

		.tb-overflow
			table.table
				colgroup
					col(style="width: 3.75rem")
					col(style="width: 5rem")
					col
					col(style="width: 10%")
				thead
					tr
						th(scope="col") 
							label.checkbox
								input(type="checkbox" name="checkbox")
								span.label-checkbox
						th.sort.sort-up(scope="col") NO
						th.left(scope="col") 회사명
						th(scope="col") 대표명

				tbody
					tr
						td 
							label.checkbox
								input(type="checkbox" name="checkbox")
								span.label-checkbox
						td 01
						td.left 회사
						td 이름

		.pagination
			button.btn-prev(type="button")
			button.active(type="button") 1
			button(type="button") 2
			button(type="button") 3
			button(type="button") 4
			button(type="button") 5
			button.btn-next(type="button")

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