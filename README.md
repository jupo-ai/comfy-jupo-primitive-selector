# comfy-jupo-primitive-switch

<img src="https://ul.h3z.jp/IETgruJh.png" height=400>

定数スイッチ

## Install
1. custom_nodesフォルダにリポジトリをクローン
   ```
   git clone https://github.com/jupo-ai/comfy-jupo-primitive-switch.git
   ```


## 使い方
- 追加ボタンを押して、値を入力します
- 左側のトグルボタンは常に1つだけがONになります
- ONの値がない場合は以下が出力されます
  - `Int Switch` = 0
  - `Float Switch` = 0.0
  - `String Switch` = "" (空文字)