// Database
const i8_database = require("../database/connect");

// Router (Express)
var express = require("express");
var router = express.Router();

// TCP/IP
const net = require("net");

// ADD: body paser, cors
var cors = require("cors");
var bodyParser = require("body-parser");
router.use(bodyParser.urlencoded({ extended: false }));
// router.use(cors());
router.use(bodyParser.json());
router.use(
  cors({
    origin: ["http://183.101.208.3:14530", "http://localhost:3000"],
    credentials: true,
  })
);

// IMAGE
const multer = require("multer");
const fs = require("fs");

var storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "location_images/"); // cb 콜백함수를 통해 전송된 파일 저장 디렉토리 설정
  },
  filename: function (req, file, cb) {
    cb(null, "undefined"); // cb 콜백함수를 통해 전송된 파일 이름 설정
  },
});

var upload = multer({ storage: storage });
router.use(express.static("Images"));

// data primary key
const { v4: uuidv4 } = require("uuid");

// Read: 저장된 i8-sensor 데이터 전송
router.post("/data", (req, res) => {
  const cluster_unit = String(req.body.cluster_unit);
  const cluster_name = String(req.body.cluster_name);

  console.log(cluster_name);
  console.log(cluster_unit);

  let sql = "";

  let searchTerm;

  if (
    cluster_unit === "City" ||
    cluster_unit === "Gu" ||
    cluster_unit === "Address"
  ) {
    searchTerm = [`%${cluster_name}%`];
    sql =
      "SELECT * FROM i8_data JOIN i8_device ON i8_data.product_serial_number = i8_device.product_serial_number WHERE address LIKE ?";
  } else if (cluster_unit === "Group") {
    searchTerm = [cluster_name];
    sql =
      "SELECT * FROM i8_data JOIN i8_device ON i8_data.product_serial_number = i8_device.product_serial_number WHERE i8_device.cluster = ?;";
  } else if (cluster_unit === "Location") {
    searchTerm = [cluster_name];
    sql =
      "SELECT * FROM i8_data JOIN i8_device ON i8_data.product_serial_number = i8_device.product_serial_number WHERE i8_device.location = ?;";
  }

  try {
    i8_database.query(sql, [searchTerm], (error, rows, fields) => {
      try {
        if (!error) {
          console.log("[SYSTEM] address update success");

          res.status(200).json({
            status: "success",
            data: rows,
          });

          console.log();
        }
      } catch (e) {
        console.log("[ERROR] DB error");

        res.status(500).json({
          status: "error",
          msg: "DB 오류 발생",
        });

        console.log(e);
      }
    });
  } catch (e) {
    console.log("[ERROR] SERVER error");

    res.status(500).json({
      status: "error",
      msg: "서버 오류 발생",
    });

    console.log(e);
  }
});

// Read: 저장된 i8-sensor 단말 정보 전체 전송
router.get("/device", (req, res) => {
  // const sql = "SELECT * FROM i8_device";
  // const sql = "select * from i8_device a left join i8_image b on a.location = b.location;"
  const sql = "select a.product_serial_number, a.address, a.cluster, a.location, a.image_x, a.image_y, b.image_url  from i8_device a left join i8_image b on a.location = b.location;"

console.log("-=========")

  try {
    i8_database.query(sql, (error, rows, fields) => {
      try {
        if (!error) {
          console.log("[SYSTEM] get data success");
          // console.log(rows)

          // rows.map(el=> { el.image_url을 버퍼 인코딩으로 바꿔주기 })

          // var imageBuffer = fs.readFileSync(rows[0].image_url);

          // // base64로 이미지 인코딩
          // var encode = Buffer.from(imageBuffer).toString("base64");      


          res.status(200).json({
            status: "success",
            data: rows,
          });

          console.log(rows);
        }
      } catch (e) {
        console.log("[ERROR] DB error");

        res.status(500).json({
          status: "error",
          msg: "DB 오류 발생",
        });

        console.log(e);
      }
    });
  } catch (e) {
    console.log("[ERROR] SERVER error");

    res.status(500).json({
      status: "error",
      msg: "서버 오류 발생",
    });

    console.log(e);
  }
});

// Read: 저장된 i8-sensor cluster 정보 전체 전송
router.get("/cluster", (req, res) => {
  const sql = "SELECT * FROM i8_cluster";

  try {
    i8_database.query(sql, (error, rows, fields) => {
      try {
        if (!error) {
          console.log("[SYSTEM] get data success");

          res.status(200).json({
            status: "success",
            data: rows,
          });

          console.log();
        }
      } catch (e) {
        console.log("[ERROR] DB error");

        res.status(500).json({
          status: "error",
          msg: "DB 오류 발생",
        });

        console.log(e);
      }
    });
  } catch (e) {
    console.log("[ERROR] SERVER error");

    res.status(500).json({
      status: "error",
      msg: "서버 오류 발생",
    });

    console.log(e);
  }
});

// Update: 기기 등록
router.post("/device/register", (req, res) => {
  const sql = "insert into i8_device (product_serial_number, address, cluster, location) values(?, ?, ?, ?);"

  console.log(req.body);

  try {
    i8_database.query(
      sql,
      [
        req.body.product_serial_number,
        req.body.address,
        req.body.cluster,
        req.body.location,       
      ],
      (error, rows, fields) => {
        if (error) {
          console.log("[ERROR] SQL query error");
          console.log(error);

          return res.status(500).json({
            status: "error",
            msg: "DB 오류 발생",
          });
        }

        console.log("[SYSTEM] address update success");
        // Additional logic or response can be added here if needed.

        res.status(200).json({
          status: "success",
          data: null,
        });
      }
    );
  } catch (e) {
    console.log("[ERROR] SERVER error");

    res.status(500).json({
      status: "error",
      msg: "서버 오류 발생",
    });

    console.log(e);
  }
});

// Update: 각 그룹의 대표 기기 지정
router.post("/cluster/register", (req, res) => {
  const sql =
    "UPDATE i8_cluster SET address = ? WHERE cluster = ? AND (address IS NULL)";

  console.log(req.body);

  try {
    i8_database.query(
      sql,
      [req.body.address, req.body.cluster],
      (error, rows, fields) => {
        try {
          if (!error) {
            console.log("[SYSTEM] address update success");

            res.status(200).json({
              status: "success",
              data: null,
            });

            console.log();
          }
        } catch (e) {
          console.log("[ERROR] DB error");

          res.status(500).json({
            status: "error",
            msg: "DB 오류 발생",
          });

          console.log(e);
        }
      }
    );
  } catch (e) {
    console.log("[ERROR] SERVER error");

    res.status(500).json({
      status: "error",
      msg: "서버 오류 발생",
    });

    console.log(e);
  }
});

// Update: 저장된 i8-sensor 단말 정보의 이미지 속 좌표 정보 갱신
router.post("/device/image/register/coordinate", (req, res) => {
  const sql =
    "UPDATE i8_device SET image_x = ?, image_y = ? WHERE product_serial_number = ?";

  console.log(req.body);

  try {
    i8_database.query(
      sql,
      [req.body.image_x, req.body.image_y, req.body.product_serial_number],
      (error, rows, fields) => {
        try {
          if (!error) {
            console.log("[SYSTEM] address update success");

            res.status(200).json({
              status: "success",
              data: null,
            });

            console.log();
          }
        } catch (e) {
          console.log("[ERROR] DB error");

          res.status(500).json({
            status: "error",
            msg: "DB 오류 발생",
          });

          console.log(e);
        }
      }
    );
  } catch (e) {
    console.log("[ERROR] SERVER error");

    res.status(500).json({
      status: "error",
      msg: "서버 오류 발생",
    });

    console.log(e);
  }
});

// Read: 해당 기기의 이미지 속 좌표 정보 전송
router.post("/device/image/coordinate", (req, res) => {
  const sql =
    "SELECT image_x, image_y from i8_device WHERE product_serial_number = ?";

  try {
    i8_database.query(
      sql,
      [req.body.product_serial_number],
      (error, rows, fields) => {
        try {
          if (!error) {
            console.log("[SYSTEM] coordinate get success");
            // console.log(rows);

            res.status(200).json({
              status: "success",
              data: {
                imageX: rows[0].image_x,
                imageY: rows[0].image_y,
              },
            });
          }
        } catch (e) {
          console.log("[ERROR] DB error");

          res.status(500).json({
            status: "error",
            msg: "DB 오류 발생",
          });

          console.log(e);
        }
      }
    );
  } catch (e) {
    console.log("[ERROR] SERVER error");

    res.status(500).json({
      status: "error",
      msg: "서버 오류 발생",
    });

    console.log(e);
  }
});

// Create: 해당 장소명의 이미지 등록
router.post("/device/image/register", upload.single("image"), (req, res) => {
  // 저장한 이미지 파일("undefined.png")의 이름을 요청 장소명으로 변경
  fs.renameSync(
    req.file.path,
    req.file.path.replace(
      "undefined",
      `${req.body.cluster}-${req.body.location}.jpg`
    )
  );

      // "UPDATE i8_image SET image_url = ? WHERE cluster = ? AND location = ?";
  const sql =
    "INSERT INTO i8_image (product_serial_number, cluster, location, image_url) values(?, ?, ?, ?)";


  try {
    i8_database.query(
      sql,
      [
        req.body.product_serial_number,
        req.body.cluster,
        req.body.location,
        `location_images/${req.body.cluster}-${req.body.location}.jpg`,
        // `location_images/${req.body.cluster}-${req.body.location}.png`,   //여기가 수정이 덜 되되어 있었음, 확장자 jpg로 저장하기로 했음
      ],
      (error, rows, fields) => {
        try {
          if (!error) {
            console.log("[SYSTEM] image update success");

            res.status(200).json({
              status: "success",
              data: null,
            });

            // console.log();
          }
        } catch (e) {
          console.log("[ERROR] DB error");

          res.status(500).json({
            status: "error",
            msg: "DB 오류 발생",
          });

          console.log(e);
        }
      }
    );
  } catch (e) {
    console.log("[ERROR] SERVER error");

    res.status(500).json({
      status: "error",
      msg: "서버 오류 발생",
    });

    console.log(e);
  }
});

// Delete: device삭제
router.post("/device/delete", (req, res) => {
  const sql = "DELETE from i8_device where product_serial_number = ?";
  console.log(1);

  try {
    i8_database.query(sql, [req.body.product_serial_number], (error, rows, fields) => {
      if (error) {
        console.log("[ERROR] SQL query error");
        console.log(error);

        return res.status(500).json({
          status: "error",
          msg: "DB 오류 발생",
        });
      }

      console.log("[SYSTEM] address delete success");
      res.status(200).json({
        status: "success",
        data: null,
      });
    });
  } catch (e) {
    console.log("[ERROR] SERVER error");

    res.status(500).json({
      status: "error",
      msg: "서버 오류 발생",
    });

    console.log(e);
  }
});

    // Delete: device 이미지 삭제
    router.post("/device/delete/image", (req, res) => {
      const sql = "DELETE FROM i8_image WHERE product_serial_number = ?";
    
      try {
        i8_database.query(sql, [req.body.product_serial_number], (error, rows, fields) => {
          if (error) {
            console.log("[ERROR] SQL query error");
            console.log(error);
    
            return res.status(500).json({
              status: "error",
              msg: "DB 오류 발생",
            });
          }
    
          console.log("[SYSTEM] image delete success");
          res.status(200).json({
            status: "success",
            data: null,
          });
        });
      } catch (e) {
        console.log("[ERROR] SERVER error");
    
        res.status(500).json({
          status: "error",
          msg: "서버 오류 발생",
        });
    
        console.log(e);
      }
    });
    


// Read: 해당 장소명의 이미지 가져오기
router.post("/device/image", (req, res) => {
  const sql =
    "SELECT image_url from i8_image WHERE cluster = ? AND location = ?";

  try {
    i8_database.query(
      sql,
      [req.body.cluster, req.body.location],
      (error, rows, fields) => {
        try {
          if (!error) {
            console.log("[SYSTEM] image get success");
            // console.log(rows);

            var imageBuffer = fs.readFileSync(rows[0].image_url);

            // base64로 이미지 인코딩
            var encode = Buffer.from(imageBuffer).toString("base64");           

            res.status(200).json({
              status: "success",
              data: encode,
            });

            // fs.readFile(rows[0].image_url, (err, data) => {
            //   if (err) {
            //     res.status(500).json({
            //       status: "error",
            //       message: "Internal server error",
            //     });
            //   } else {
            //     res.writeHead(200, { "Content-Type": "image/png" });
            //     res.end(data);
            //   }
            // });
          }
        } catch (e) {
          console.log("[ERROR] DB error");

          res.status(500).json({
            status: "error",
            msg: "DB 오류 발생",
          });

          console.log(e);
        }
      }
    );
  } catch (e) {
    console.log("[ERROR] SERVER error");

    res.status(500).json({
      status: "error",
      msg: "서버 오류 발생",
    });

    console.log(e);
  }
});



// Read: 장소 이미지 전체 가져오기
router.get("/device/imageAll", (req, res) => {

  const sql =
    "SELECT * from from i8_image";

  try {
    i8_database.query(
      sql,
      [req.body.cluster, req.body.location],
      (error, rows, fields) => {
        try {
          if (!error) {
            console.log("[SYSTEM] image get success");
            console.log(rows);

            var imageBuffer = fs.readFileSync(rows[0].image_url);

            // base64로 이미지 인코딩
            var encode = Buffer.from(imageBuffer).toString("base64");           

            res.status(200).json({
              status: "success",
              data: encode,
            });

            // fs.readFile(rows[0].image_url, (err, data) => {
            //   if (err) {
            //     res.status(500).json({
            //       status: "error",
            //       message: "Internal server error",
            //     });
            //   } else {
            //     res.writeHead(200, { "Content-Type": "image/png" });
            //     res.end(data);
            //   }
            // });
          }
        } catch (e) {
          console.log("[ERROR] DB error");

          res.status(500).json({
            status: "error",
            msg: "DB 오류 발생",
          });

          console.log(e);
        }
      }
    );
  } catch (e) {
    console.log("[ERROR] SERVER error");

    res.status(500).json({
      status: "error",
      msg: "서버 오류 발생",
    });

    console.log(e);
  }
});

// closer function
function TEMP_DATA() {
  // static
  let obj = {
    product_serial_number: null,
    measurement_timestamp: new Date(),
    temperature: null,
    humidity: null,
    receive_data_amount: 0,
    transmit_data_amount: 0,
  };

  return {
    setObject(data, select_index) {
      obj[select_index] = data;
    },

    getObject() {
      const uuid = uuidv4();

      let dataArray = [uuid, ...Object.values(obj)];
      const sql_insert_data =
        "INSERT INTO i8_data (id, product_serial_number, measurement_timestamp, temperature, humidity, receive_data_amount, transmit_data_amount) VALUES (?, ?, ?, ?, ?, ?, ?)";

      // Create: 수신한 데이터를 DB에 저장 (i8_data table)
      i8_database.query(
        sql_insert_data,
        dataArray,
        (error, results, fields) => {
          if (!error) {
            console.log("[SYSTEM] insert data success");
            console.log("<DATA>");
            console.log(dataArray);
            console.log();
          }
        }
      );

      const sql_insert_device =
        "INSERT IGNORE INTO i8_device (product_serial_number) VALUES (?)";

      // Create: 현재 단말의 SN을 DB에 저장 (i8_device table)
      i8_database.query(
        sql_insert_device,
        obj.product_serial_number,
        (error, rows, fields) => {
          try {
            if (!error) {
              if (rows.warningCount === 1) {
                console.log("[SYSTEM] device already exist");
              } else {
                console.log("[SYSTEM] device SN insert success");
              }

              console.log();
            }
          } catch (e) {
            console.log("[ERROR] DB error");
            console.log(e);
          }
        }
      );
    },
  };
}

//////////////// i8-sensor socket code ////////////////

function UNPACK_STX_INFO(buffer, obj) {
  const STX = buffer.readUInt8(0); // 1 byte
  const VER = buffer.readUInt8(1); // 1 byte
  const TYPE = buffer.readUInt8(2); // 1 byte
  const STATUS = buffer.readUInt8(3); // 1 byte

  // 0x00 : 정상, 0x01 : ERROR - CRC
  if (STATUS === 1) {
    console.log(`[ERROR] STATUS ${STATUS} : packet error`);
    return false;
  }

  return true;
}

function UNPACK_SN(buffer, obj) {
  const SN_TYPE = buffer.readUInt8(4); // 1 byte
  const SN_PRODUCT_CODE = buffer.readUInt16BE(5); // 2 byte
  const SN_BOM_VER = buffer.readUInt8(7); // 1 byte
  const SN_PRODUCTION_DATE = buffer.readUInt16BE(8); // 1 byte
  const SN_PRODUCTION_NUM = buffer.readUInt32BE(10); // 2 byte

  const PRODUCT_SERIAL_NUMBER = `${SN_TYPE}${SN_PRODUCT_CODE}${SN_BOM_VER}${SN_PRODUCTION_DATE}${SN_PRODUCTION_NUM}`;
  obj.setObject(PRODUCT_SERIAL_NUMBER, "product_serial_number");
}

function UNPACK_LEN_CRC(buffer, obj) {
  const LENGTH = buffer.readUInt32BE(14); // 4 byte
  const CRC = buffer.readUInt32BE(18); // 4 byte
}

function UNPACK_DATA_TAG(buffer, obj) {
  // 2 TAG
  // : temperature, humidity
  const DATA_TAG_GROUP_0 = buffer.readUInt8(22); // 1 byte
  const DATA_TAG_ID_0 = buffer.readUInt16BE(23); // 2 byte
  const DATA_VALUE_COUNT_0 = buffer.readUInt8(25); // 1 byte
  const DATA_VALUE_TYPE_0 = buffer.readUInt8(26); // 1 byte
  const DATA_VALUE_LENGTH_0 = buffer.readUInt8(27); // 1 byte
  const DATA_TEMPERATURE = buffer.readFloatLE(28); // 4 byte
  obj.setObject(DATA_TEMPERATURE, "temperature");

  const DATA_TAG_GROUP_1 = buffer.readUInt8(32); // 1 byte
  const DATA_TAG_ID_1 = buffer.readUInt16BE(33); // 2 byte
  const DATA_VALUE_COUNT_1 = buffer.readUInt8(35); // 1 byte
  const DATA_VALUE_TYPE_1 = buffer.readUInt8(36); // 1 byte
  const DATA_VALUE_LENGTH_1 = buffer.readUInt8(37); // 1 byte
  const DATA_HUMIDITY = buffer.readFloatLE(38); // 4 byte
  obj.setObject(DATA_HUMIDITY, "humidity");

  console.log();
}
// socket server (port 30001)
const i8_server = net.createServer((socket) => {
  console.log("[SYSTEM] socket connected");

  // event handler: data sent
  socket.on("data", (data) => {
    const dataOriginal = data;
    const dataString = data.toString("hex");

    // original data copy buffer
    let buffer = Buffer.alloc(0);
    buffer = Buffer.concat([buffer, dataOriginal]);

    // 클로저 함수로 정적 객체 생성
    const obj = TEMP_DATA();

    try {
      let packet_status = UNPACK_STX_INFO(buffer, obj);
      if (!packet_status) return;

      obj.setObject(buffer.length, "receive_data_amount");

      UNPACK_SN(buffer, obj);
      UNPACK_LEN_CRC(buffer, obj);
      UNPACK_DATA_TAG(buffer, obj);

      obj.getObject();
    } catch (e) {
      console.log(e);
    }
  });

  // event handler: socket disconnected
  socket.on("end", () => {
    console.log("[SYSTEM] socket disconnected");
  });

  // event handler: error occurred
  socket.on("error", (err) => {
    console.error("[ERROR] Socket Error:", err.message);
  });
});

// listen port 30001
i8_server.listen(30001, () => {
  console.log("[SYSTEM] waiting for client . . .");
});

module.exports = router;
