/*
Template Name: Monster Admin
Author: Themedesigner
Email: niravjoshi87@gmail.com
File: js
*/
$(function() {
    "use strict";
      $(".tst1").click(function(){
           $.toast({
            heading: 'Welcome to Monster admin',
            text: 'Use the predefined ones, or specify a custom position object.',
            position: 'top-right',
            loaderBg:'#ff6849',
            icon: 'info',
            hideAfter: 3000, 
            stack: 6
          });

     });

      $(".tst3").click(function(){
           $.toast({
            heading: '信息不完整或正在执行中 . . .',
            text: '控制台展示结果，则代表执行完成.',
            position: 'top-right',
            loaderBg:'#ff6849',
            icon: 'warning',
            hideAfter: 25000,
            stack: 6
          });

     });
      $(".tst2").click(function(){
           $.toast({
            heading: '正在执行中，请耐心等待 . . .',
            text: '控制台展示结果，则代表执行完成.',
            position: 'top-right',
            loaderBg:'#ff6849',
            icon: 'success',
            hideAfter: 25000,
            stack: 6
          });

     });

      $(".tst4").click(function(){
           $.toast({
            heading: 'Welcome to Monster admin',
            text: 'Use the predefined ones, or specify a custom position object.',
            position: 'top-right',
            loaderBg:'#ff6849',
            icon: 'error',
            hideAfter: 3500
            
          });

     });
});
          
