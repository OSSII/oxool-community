## 模組配置檔(module.xml.in)說明

模組配置檔是依據 module.xml.in 檔案，在 ./configure 執行後產生。所以要修改實際配置內容，需更改這個檔案。

如果要更改這個檔案，建議使用 oxool-xml-config 指令修改，可避免資料字元與 xml 特殊字元衝突。

oxool-xm-config 可以讀取、刪除以及修改配置檔內容，其用法如下：

```
oxool-xml-config --help
usage: oxool-xml-config OPTIONS
Read or add/delete/modify xml configuration file content.

-h, --help                            Print this help.
-ffile, --config-file=file            The specified xml file.
-gkey, --get=key                      Get the content of the specified key.
-dkey, --remove=key                   Remove the specified key.
-s"key='value'", --set="key='value'"  Set the content of the specified key.
```

1. 讀取內容：  
   oxool-xml-config -f module.xml.in -g "**key**"
2. 刪除內容：  
   oxool-xml-config -f module.xml.in -d "**key**"
3. 修改內容：  
   oxool-xml-config -f module.xml.in -s "**key=value**"

**key** 類似簡化版的 [XPath](https://zh.wikipedia.org/zh-tw/XPath)，不同的是，路徑字元以 '.' 號取代 '/' 號，以下列的 XML 文件為例：

```
<config>
    <module type="bool" enable="true">
        <load>Table2SC.so</load>
        <detail>
            <name>Table2SC</name>
            <serviceURI>/lool/tbl2sc</serviceURI>
            <version>1.0.0</version>
            <summary>Convert HTML Table to Spreadsheet or PDF.</summary>
            <author>Firefly %lt;firefly@ossii.com.tw&gt;</author>
            <license>MPLv2.0</license>
            <description>This service provides conversion of HTML Table content into spreadsheet or PDF format.</description>
            <adminPrivilege desc="Requires admin authentication." type="bool" default="false">false</adminPrivilege>
            <adminIcon desc="Please refer to https://icons.getbootstrap.com/ for icon names.">table</adminIcon>
            <adminItem>Table conversion spreadsheet.</adminItem>
        </detail>
    </module>
</config>
```

下列都是有效的 **key**：

```
module[@enable]                     -> true
module.load                         -> Table2SC.so
module.detail.author                -> Firefly <firefly@ossii.com.tw>
module.detail.adminPrivilege[@desc] -> Requires admin authentication.
```

以下就各個 key 做說明：

* **module[@enable]**  
  啟用(true)或禁用(false)模組。
* **module.load**  
  載入的模組檔名，這是自動組態，一般不需自行指定。
* **module.detail.name**  
  模組名稱，必須是唯一名稱，可為英文、數字及底線 '\_'。
* **module.detail.serviceURI**  
  模組的服務位址，必須以 '/' 開頭。serviceURI 有兩種格式：
  * **end point** 格式：  
    例如 /lool/endpoint 最後非 '/' 結尾，此種格式用途單一，只有一個位址，適合簡單功能的 restful api。
  * **最後爲 '/' 結尾的目錄格式**：  
    例如 /lool/drawio/，此種格式，模組可自由管理 /lool/drawio/ 之後所有位址，適合複雜的 restful api。
* **module.detail.version**  
  版本編號。
* **module.detail.summary**  
  簡介。
* **module.detail.author**  
  作者。
* **module.detail.license**  
  授權。
* **module.detail.description**  
  詳細說明。
* **module.detail.adminPrivilege**  
  該 serviceURI 是否需要 admin 授權。
* **module.detail.adminIcon**  
  主控台管理圖示。([參考 Bootstrap Icons](https://icons.getbootstrap.com/))
* **module.detail.adminItem**  
  主控台標題。😱 請注意！！😱 模組若提供有主控台功能，這裡必須填寫標題，否則視同無主控台管理。  
  主控台程序撰寫，請參考 admin/ 目錄下的範例，admin/admin.html 及 admin/admin.js 是必要檔案，admin/localizations.json 及 admin/l10n/\* 是本地化翻譯相關檔案。