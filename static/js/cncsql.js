function importbatch()
{
    var fname = $('#id_batchfile').val().trim();  # 自动生成的
    if ("" == fname) {
        alert("未选择批量开户文件");
        return;
    }    $('#IMPORT_WL').button("loading");
    var fdata = new FormData();  #构建表单数据                   
    fdata.append('opt', 'whitelist');
    fdata.append('stype', $('#id_stype').val());               #自动生成的
    fdata.append('batchfile', $('#id_batchfile')[0].files[0]); 
    $.ajax({
        url : '/whitelist/',
        data : fdata,
        cache : false,
        contentType : false,
        processData : false,
        type : 'POST',
        success : function(rdata) {
            $('#IMPORT_WL').button("reset");
            rdata = JSON.parse(rdata);
    }
    });
}