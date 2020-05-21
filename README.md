oxool-community Ubuntu-18.04 編譯與打包教學
===

# 官方文件連結

* [OxOffice Online(OxOOL)編譯說明](https://docs.ossii.com.tw/books/oxoffice-online-%E6%8A%80%E8%A1%93%E6%89%8B%E5%86%8A/chapter/oxoffice-online%28oxool%29%E7%B7%A8%E8%AD%AF%E8%AA%AA%E6%98%8E)
* [OxOffice Online 主程式安裝說明](https://docs.ossii.com.tw/books/oxoffice-online-%E6%8A%80%E8%A1%93%E6%89%8B%E5%86%8A/chapter/oxoffice-online-%E4%B8%BB%E7%A8%8B%E5%BC%8F%E5%AE%89%E8%A3%9D%E8%AA%AA%E6%98%8E)
* [OxOffice Online 社群版操作手冊](https://docs.ossii.com.tw/books/oxoffice-online-%E7%A4%BE%E7%BE%A4%E7%89%88%E6%93%8D%E4%BD%9C%E6%89%8B%E5%86%8A)

# 作業系統與相依套件

* 作業系統須為: Ubuntu-18.04
* oxool-community 需要搭載的套件為
  * OxOffice-8.4.2
  * Poco-1.9.0

# 編譯與打包環境建置

### 安裝編譯打包大部分需要的套件
請透過下方指令執行腳本來安裝
```
./install_build_require_ubuntu.sh
```

### 安裝NVM與設定環境變數
需要額外安裝的只有 node 與 npm，以下會教透過 Node Version Manager  (NVM)來安裝。

```
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.35.3/install.sh | bash
 ```
下面為兩行指令
```
export NVM_DIR="$([ -z "${XDG_CONFIG_HOME-}" ] && printf %s "${HOME}/.nvm" || printf %s "${XDG_CONFIG_HOME}/nvm")"
[ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh" # This loads nvm
 ```

### 安裝 nodejs 
```
nvm install v10
nvm use v10
```
### 安裝 poco 或是自行編譯安裝(oxool-community所需的poco為1.9.0)
```
git clone https://github.com/pocoproject/poco
cd poco
git checkout poco-1.9.0
./configure
make -j4
make install
```

# 編譯 oxool-community 與執行
```
透過 autotool 設定專案
./autogen.sh

編譯
make -j4

執行
make run
```

# 打包

打包所需之套件請透過章節2來安裝，接下來需要在完成一項環境設定
我們使用的打包工具 debhelper 會在打包時啟用 fakeroot 環境，所以環境的執行檔會以 root 為主，因此請根據以下的教學將 npm & node 的執行路徑新增至 『/usn/bin』
```
whereis npm
#會得到類似 /home/tommy/.nvm/versions/node/v10.19.0/bin/npm 的結果
#請將以下的 /home/tommy/.nvm/versions/node/v10.19.0/bin/ 取代為你的
sudo ln -s /home/tommy/.nvm/versions/node/v10.19.0/bin/* /usr/bin/
```

接下來請在專案的根目錄執行
```
debuild -b -uc -us
```

最後打包的 deb 結果會生成在專案的上層目錄
```
cd ..
ls oxool_3.2.5-1.community_amd64.deb
```
