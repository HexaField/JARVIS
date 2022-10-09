# JARVIS


# Modules

## Speech To Text

Using https://github.com/MainRo/deepspeech-server

### Install STT

```
pip3 install deepspeech-server
```

if it complains about not having pip3.8 installed do
```
wget https://bootstrap.pypa.io/get-pip.py
python3.8 get-pip.py
```

save language models from https://coqui.ai/english/coqui/v1.0.0-large-vocab#download to /stt and edit config.yaml to reflect file names

### Run STT Server

```
cd stt
deepspeech-server --config config.yaml
```


### Talk to STT Server

`curl -X POST --data-binary @new-home-in-the-stars-16k.wav http://localhost:8080/stt`